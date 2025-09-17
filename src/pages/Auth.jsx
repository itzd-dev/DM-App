import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Auth = () => {
  const { login, loginWithGoogle, signInWithEmail, signUpWithEmail, navigateTo, isLoggedIn, userRole, setAdminPage } = useAppContext();
  const [authTab, setAuthTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('pengguna@email.com');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    await signInWithEmail(loginEmail, (document.getElementById('login-password')?.value || ''));
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    await signUpWithEmail(registerEmail, (document.getElementById('register-password')?.value || ''), registerName);
  }

  // Jika sesi sudah aktif (misal sesaat setelah login), arahkan ke profil
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!userRole) return; // tunggu role terbaca
    if (userRole === 'admin') {
      setAdminPage?.('dashboard', { replace: true });
      navigateTo('/admin/dashboard');
    } else {
      navigateTo('profile');
    }
  }, [isLoggedIn, userRole, navigateTo, setAdminPage]);

  return (
    <section id="page-auth" className="page-section p-8">
      <h2 className="text-2xl font-bold text-brand-primary text-center">
        Selamat Datang
      </h2>
      <p className="text-brand-text-light text-center text-sm mb-6">
        Masuk atau buat akun untuk melanjutkan.
      </p>

      <div className="flex border-b border-brand-subtle mb-6">
        <button
          id="login-tab"
          onClick={() => setAuthTab('login')}
          className={`auth-tab flex-1 pb-2 font-semibold text-sm border-b-2 ${authTab === 'login' ? 'active' : 'border-transparent text-gray-400'}`}>
          Masuk
        </button>
        <button
          id="register-tab"
          onClick={() => setAuthTab('register')}
          className={`auth-tab flex-1 pb-2 font-semibold text-sm border-b-2 ${authTab === 'register' ? 'active' : 'border-transparent text-gray-400'}`}>
          Daftar
        </button>
      </div>

      {/* Login Form */}
      <form id="login-form" onSubmit={handleLogin} className={authTab === 'login' ? '' : 'hidden'}>
        <div className="mb-4">
          <label htmlFor="login-email" className="text-sm font-medium text-brand-text-light">Email</label>
          <input type="email" id="login-email" className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
        </div>
        <div className="mb-4">
          <label htmlFor="login-password" className="text-sm font-medium text-brand-text-light">Password</label>
          <input type="password" id="login-password" className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" defaultValue="123456" />
        </div>
        <a href="#" className="text-xs text-brand-accent font-semibold text-right block mb-4">Lupa Password?</a>
        <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition text-sm">
          Masuk
        </button>
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full mt-3 bg-white border-2 border-brand-subtle text-brand-text font-semibold py-3 rounded-lg hover:bg-brand-bg transition text-sm flex items-center justify-center gap-2">
          <i className="fab fa-google text-red-500"></i>
          Masuk/Daftar dengan Google
        </button>
      </form>

      {/* Register Form */}
      <form id="register-form" onSubmit={handleRegister} className={authTab === 'register' ? '' : 'hidden'}>
        <div className="mb-4">
          <label htmlFor="register-name" className="text-sm font-medium text-brand-text-light">Nama Lengkap</label>
          <input type="text" id="register-name" className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label htmlFor="register-email" className="text-sm font-medium text-brand-text-light">Email</label>
          <input type="email" id="register-email" className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label htmlFor="register-password" className="text-sm font-medium text-brand-text-light">Password</label>
          <input type="password" id="register-password" className="w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" defaultValue="123456" />
        </div>
        <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition text-sm">
          Daftar
        </button>
      </form>
    </section>
  );
};

export default Auth;
