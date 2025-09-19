import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useUi } from '../ui/UiContext';
import { safeLoad, safeSave } from '../../utils/storage';

const UserContext = createContext(null);

const DEFAULT_POINTS = {
  'pengguna@email.com': 100,
  'andi@example.com': 250,
};

const DEFAULT_PROFILES = {
  'pengguna@email.com': { favoriteProducts: [1, 3] },
  'andi@example.com': { favoriteProducts: [6, 19] },
};

export const UserProvider = ({ children }) => {
  const { loggedInUser, getAuthHeaders } = useAuth();
  const { showToast } = useUi();

  const [customerPoints, setCustomerPoints] = useState(() => safeLoad('customerPoints', {}));
  const [customerProfiles, setCustomerProfiles] = useState(() => safeLoad('customerProfiles', {}));
  const [initialCart, setInitialCart] = useState([]);
  const [initialWishlist, setInitialWishlist] = useState([]);
  const [userStateReady, setUserStateReady] = useState(false);
  const lastPersistedProfile = useRef(null);

  useEffect(() => safeSave('customerPoints', customerPoints), [customerPoints]);
  useEffect(() => safeSave('customerProfiles', customerProfiles), [customerProfiles]);

  const ensureProfile = useCallback((email) => {
    if (!email) return;
    setCustomerProfiles((prev) => {
      if (prev[email]) return prev;
      return {
        ...prev,
        [email]: {
          favoriteProducts: [],
          shippingAddress: null,
          settings: { notifyEmail: true, notifyWhatsApp: false },
        },
      };
    });
    setCustomerPoints((prev) => {
      if (typeof prev[email] === 'number') return prev;
      return { ...prev, [email]: 0 };
    });
  }, []);

  useEffect(() => {
    ensureProfile(loggedInUser?.email);
  }, [loggedInUser?.email, ensureProfile]);

  const fetchUserState = useCallback(async () => {
    const email = loggedInUser?.email;
    if (!email) {
      setInitialCart([]);
      setInitialWishlist([]);
      lastPersistedProfile.current = null;
      setUserStateReady(true);
      return { cart: [], wishlist: [], profiles: {} };
    }
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch('/api/user-state', { headers });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      const cartData = Array.isArray(data.cart) ? data.cart : [];
      const wishlistData = Array.isArray(data.wishlist) ? data.wishlist : [];
      const profilesData = data && typeof data.profiles === 'object' && data.profiles !== null ? data.profiles : {};
      setInitialCart(cartData);
      setInitialWishlist(wishlistData);
      if (Object.keys(profilesData).length) {
        setCustomerProfiles((prev) => ({ ...prev, ...profilesData }));
        if (profilesData[email]) {
          try {
            lastPersistedProfile.current = JSON.stringify(profilesData[email]);
          } catch (_) {
            lastPersistedProfile.current = null;
          }
        }
      }
      setUserStateReady(true);
      return { cart: cartData, wishlist: wishlistData, profiles: profilesData };
    } catch (error) {
      console.error('[user] fetchUserState failed', error);
      setUserStateReady(true);
      return null;
    }
  }, [getAuthHeaders, loggedInUser?.email]);

  useEffect(() => {
    let active = true;
    setUserStateReady(false);
    (async () => {
      await fetchUserState();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [fetchUserState]);

  const persistUserState = useCallback(async (partial) => {
    if (!loggedInUser?.email) return;
    const body = {};
    if (partial.cart !== undefined) body.cart = partial.cart;
    if (partial.wishlist !== undefined) body.wishlist = partial.wishlist;
    if (partial.profiles !== undefined) body.profiles = partial.profiles;
    if (Object.keys(body).length === 0) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/user-state', {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      if (partial.profiles && partial.profiles[loggedInUser.email]) {
        try {
          lastPersistedProfile.current = JSON.stringify(partial.profiles[loggedInUser.email]);
        } catch (_) {
          lastPersistedProfile.current = null;
        }
      }
    } catch (error) {
      console.error('[user] persistUserState failed', error);
    }
  }, [getAuthHeaders, loggedInUser?.email]);

  const saveShippingAddress = useCallback((address) => {
    const email = loggedInUser?.email;
    if (!email) {
      showToast('Silakan login.');
      return;
    }
    const nextProfile = {
      ...(customerProfiles[email] || {}),
      shippingAddress: address,
    };
    setCustomerProfiles((prev) => ({
      ...prev,
      [email]: nextProfile,
    }));
    persistUserState({ profiles: { [email]: nextProfile } });
    showToast('Alamat tersimpan.');
  }, [loggedInUser?.email, showToast, customerProfiles, persistUserState]);

  const saveUserSettings = useCallback((settings) => {
    const email = loggedInUser?.email;
    if (!email) {
      showToast('Silakan login.');
      return;
    }
    const nextProfile = {
      ...(customerProfiles[email] || {}),
      settings: { ...(customerProfiles[email]?.settings || {}), ...settings },
    };
    setCustomerProfiles((prev) => ({
      ...prev,
      [email]: nextProfile,
    }));
    persistUserState({ profiles: { [email]: nextProfile } });
    showToast('Pengaturan disimpan.');
  }, [loggedInUser?.email, showToast, customerProfiles, persistUserState]);

  const refetchLoyalty = useCallback(async () => {
    const email = loggedInUser?.email;
    if (!email) return;
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch('/api/loyalty', { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data.points === 'number') {
          setCustomerPoints((prev) => ({ ...prev, [email]: data.points }));
        }
      }
    } catch (error) {
      console.warn('[user] refetchLoyalty failed', error);
    }
  }, [getAuthHeaders, loggedInUser?.email]);

  const fetchAllCustomerPoints = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch('/api/loyalty?all=true', { headers });
      if (resp.ok) {
        const data = await resp.json();
        showToast(`Fetched points: ${JSON.stringify(data)}`, { type: 'info', duration: 10000 });
        if (typeof data === 'object' && data !== null) {
          setCustomerPoints(data);
        }
      }
    } catch (error) {
      console.warn('[user] fetchAllCustomerPoints failed', error);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    const email = loggedInUser?.email;
    if (!email || !userStateReady) return;
    const profile = customerProfiles[email];
    if (!profile) return;
    let serialized;
    try {
      serialized = JSON.stringify(profile);
    } catch (error) {
      serialized = null;
    }
    if (serialized && serialized === lastPersistedProfile.current) return;
    lastPersistedProfile.current = serialized;
    persistUserState({ profiles: { [email]: profile } });
  }, [customerProfiles, loggedInUser?.email, userStateReady, persistUserState]);

  const value = useMemo(() => ({
    customerPoints,
    setCustomerPoints,
    customerProfiles,
    setCustomerProfiles,
    ensureProfile,
    saveShippingAddress,
    saveUserSettings,
    refetchLoyalty,
    fetchAllCustomerPoints,
    fetchUserState,
    persistUserState,
    initialCart,
    initialWishlist,
    userStateReady,
  }), [
    customerPoints,
    customerProfiles,
    ensureProfile,
    saveShippingAddress,
    saveUserSettings,
    refetchLoyalty,
    fetchAllCustomerPoints,
    fetchUserState,
    persistUserState,
    initialCart,
    initialWishlist,
    userStateReady,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within UserProvider');
  }
  return context;
};