import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { safeLoad, safeRemove, safeSave } from '../../utils/storage';
import { useUi } from '../ui/UiContext';

const AuthContext = createContext(null);

const DEFAULT_USER = null;

export const AuthProvider = ({ children }) => {
  const { showToast } = useUi();

  const [isLoggedIn, setIsLoggedIn] = useState(() => safeLoad('isLoggedIn', false));
  const [loggedInUser, setLoggedInUser] = useState(() => safeLoad('loggedInUser', DEFAULT_USER));
  const [userRole, setUserRole] = useState(() => safeLoad('userRole', null));
  const [userIdentities, setUserIdentities] = useState([]);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => safeSave('isLoggedIn', isLoggedIn), [isLoggedIn]);
  useEffect(() => safeSave('loggedInUser', loggedInUser), [loggedInUser]);
  useEffect(() => safeSave('userRole', userRole), [userRole]);

  const applySession = useCallback((session) => {
    if (session && session.user) {
      const email = session.user.email;
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email || 'Pengguna';
      setIsLoggedIn(true);
      setLoggedInUser({ email, name });
      setUserIdentities(session.user.identities || []);
    } else {
      setIsLoggedIn(false);
      setLoggedInUser(DEFAULT_USER);
      setUserIdentities([]);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!supabase) {
      setAuthReady(true);
      return () => {
        isMounted = false;
      };
    }

    const fetchRole = async (session) => {
      try {
        const uid = session?.user?.id;
        if (!uid) {
          setUserRole(null);
          return;
        }
        const { data: prof, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', uid)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (!prof) {
          await supabase.from('user_profiles').insert({
            id: uid,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
            role: 'buyer',
          });
          setUserRole('buyer');
        } else {
          setUserRole(prof.role || 'buyer');
        }
      } catch (error) {
        console.error('[auth] fetchRole failed', error);
        if (isMounted) setUserRole('buyer');
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data?.session);
      fetchRole(data?.session);
      setAuthReady(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      fetchRole(session);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [applySession]);

  const login = useCallback((email, name, role = 'buyer') => {
    setIsLoggedIn(true);
    setLoggedInUser({ email, name });
    setUserRole(role);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('[auth] logout failed', error);
    }
    setIsLoggedIn(false);
    setLoggedInUser(DEFAULT_USER);
    setUserRole(null);
    try {
      if (typeof window !== 'undefined') {
        Object.keys(window.localStorage).forEach((key) => {
          if (key.startsWith('sb-')) window.localStorage.removeItem(key);
        });
        safeRemove('isLoggedIn');
        safeRemove('userRole');
        safeRemove('loggedInUser');
      }
    } catch (error) {
      console.warn('[auth] failed to clear storage', error);
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    if (!supabase) {
      showToast('Konfigurasi Supabase belum tersedia');
      return;
    }
    try {
      const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { prompt: 'select_account' } },
      });
    } catch (error) {
      console.error('[auth] loginWithGoogle failed', error);
      showToast('Gagal membuka login Google');
    }
  }, [showToast]);

  const signUpWithEmail = useCallback(async (email, password, name) => {
    if (!supabase) {
      login(email, name || 'Pengguna');
      return { data: null, error: null };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      showToast('Pendaftaran berhasil. Cek email untuk verifikasi.');
      return { data, error: null };
    } catch (error) {
      console.error('[auth] signUp failed', error);
      showToast(error.message || 'Gagal mendaftar');
      return { data: null, error };
    }
  }, [login, showToast]);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!supabase) {
      login(email, 'Pengguna');
      return { data: null, error: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Berhasil masuk');
      return { data, error: null };
    } catch (error) {
      console.error('[auth] signIn failed', error);
      showToast(error.message || 'Gagal masuk');
      return { data: null, error };
    }
  }, [login, showToast]);

  const linkGoogle = useCallback(async () => {
    if (!supabase) {
      showToast('Konfigurasi Supabase belum tersedia');
      return;
    }
    try {
      const redirectTo = window.location.origin;
      if (typeof supabase.auth.linkIdentity === 'function') {
        await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } });
      } else {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      }
    } catch (error) {
      console.error('[auth] linkGoogle failed', error);
      showToast('Gagal menghubungkan Google');
    }
  }, [showToast]);

  const getAuthHeaders = useCallback(async () => {
    const base = { 'Content-Type': 'application/json' };
    if (!supabase) return base;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      return token ? { ...base, Authorization: `Bearer ${token}` } : base;
    } catch (error) {
      console.error('[auth] getAuthHeaders failed', error);
      return base;
    }
  }, []);

  const value = useMemo(() => ({
    authReady,
    isLoggedIn,
    loggedInUser,
    userRole,
    userIdentities,
    setUserRole,
    login,
    logout,
    loginWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    linkGoogle,
    getAuthHeaders,
  }), [authReady, isLoggedIn, loggedInUser, userRole, userIdentities, login, logout, loginWithGoogle, signUpWithEmail, signInWithEmail, linkGoogle, getAuthHeaders]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
