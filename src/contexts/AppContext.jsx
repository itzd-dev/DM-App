import React, { createContext, useState, useContext, useEffect } from 'react';
import { products as initialProducts } from '../data';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Helpers for localStorage with safe JSON parse
  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState(() => load('cart', []));
  const [wishlist, setWishlist] = useState(() => load('wishlist', []));
  const [isLoggedIn, setIsLoggedIn] = useState(() => load('isLoggedIn', false));
  const [loggedInUser, setLoggedInUser] = useState(() => load('loggedInUser', null)); // { email: string, name: string }
  const [currentPage, setCurrentPage] = useState('home');
  const [pageHistory, setPageHistory] = useState(['home']);
  const [lastOrderDetails, setLastOrderDetails] = useState({});
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(() => load('userRole', null));
  const [adminPage, setAdminPage] = useState('dashboard');
  const [customerPoints, setCustomerPoints] = useState({
    'pengguna@email.com': 100, // Dummy points for default user
    'andi@example.com': 250,
  });
  const [customerProfiles, setCustomerProfiles] = useState(() => load('customerProfiles', {
    'pengguna@email.com': { favoriteProducts: [1, 3] },
    'andi@example.com': { favoriteProducts: [6, 19] },
  }));
  const [orders, setOrders] = useState([
    { id: 'DM-12345', customer: 'Andi', total: 88000, status: 'Selesai', items: [{id: 1, name: 'Dimsum Ayam', quantity: 2, price: 18000}, {id: 9, name: 'Risol Beef Mayo', quantity: 2, price: 15000}], date: '2025-09-12' },
    { id: 'DM-12346', customer: 'Bunga', total: 45000, status: 'Selesai', items: [{id: 35, name: 'Maryam Ayam Moza BBQ', quantity: 1, price: 45000}], date: '2025-09-12' },
    { id: 'DM-12347', customer: 'Citra', total: 120000, status: 'Selesai', items: [{id: 40, name: 'Kebab Daging Mini', quantity: 3, price: 40000}], date: '2025-09-11' },
    { id: 'DM-12348', customer: 'Doni', total: 75000, status: 'Selesai', items: [{id: 30, name: 'Makaroni Keju 500g', quantity: 1, price: 65000}, {id: 25, name: 'Cireng Salju', quantity: 1, price: 10000}], date: '2025-09-10' },
    { id: 'DM-12349', customer: 'Eka', total: 35000, status: 'Selesai', items: [{id: 33, name: 'Maryam Premium Cokelat', quantity: 1, price: 35000}], date: '2025-09-10' },
    { id: 'DM-12350', customer: 'Fani', total: 90000, status: 'Selesai', items: [{id: 48, name: 'Pempek Lampung', quantity: 2, price: 45000}], date: '2025-09-09' },
    { id: 'DM-12351', customer: 'Gery', total: 56000, status: 'Selesai', items: [{id: 21, name: 'Sosis Solo', quantity: 2, price: 28000}], date: '2025-09-08' },
  ]);
  const [promotions, setPromotions] = useState([
    { code: 'HEMAT10', discount: 0.1, type: 'percentage' },
    { code: 'DISKON5K', discount: 5000, type: 'fixed' },
  ]);
  const [partners, setPartners] = useState(() => load('partners', [
    { id: 1, name: 'Dapur Merifa', contact: '0812-xxxx-xxxx', notes: 'Owner utama' },
  ]));
  const [appliedDiscount, setAppliedDiscount] = useState(() => load('appliedDiscount', null));
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [userIdentities, setUserIdentities] = useState([]);

  // Small helper: force login before interaction
  const ensureLoggedIn = () => {
    if (!isLoggedIn || !loggedInUser?.email) {
      showToast('Silakan login untuk melanjutkan.');
      navigateTo('auth');
      return false;
    }
    return true;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const prevSnapshot = orders;
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Gagal update status order');
      try {
        const saved = await res.json();
        setOrders(prev => prev.map(o => (o.id === orderId ? saved : o)));
      } catch (_) {}
      await refetchOrders();
      showToast('Status pesanan diperbarui.');
    } catch (e) {
      console.error(e);
      setOrders(prevSnapshot);
      showToast('Gagal update status. Perubahan dibatalkan.');
      throw e;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Simulate 1.5 second loading time
    return () => clearTimeout(timer);
  }, []);

  // Supabase Auth binding (Google OAuth or others)
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const fetchAndSetRole = async (session) => {
      try {
        const uid = session?.user?.id;
        if (!uid) return;
        const { data: prof, error } = await supabase
          .from('user_profiles')
          .select('role,email,name')
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
      } catch (_) {}
    };
    const applySession = (session) => {
      if (!mounted) return;
      if (session && session.user) {
        const email = session.user.email;
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email || 'Pengguna';
        setIsLoggedIn(true);
        setLoggedInUser({ email, name });
        fetchAndSetRole(session);
        setUserIdentities(session.user.identities || []);
        // Arahkan ke profil setelah berhasil login (tanpa menunggu tombol)
        setCurrentPage('profile');
        setPageHistory(['profile']);
        // Sync loyalty points
        (async () => { try { await refetchLoyalty(); } catch (_) {} })();
        // Setelah sesi terpasang, hapus fragment token dari URL
        try {
          const h = window.location.hash || '';
          if (h.includes('access_token=') || h.includes('refresh_token=')) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch {}
      }
    };
    supabase.auth.getSession().then(({ data }) => applySession(data?.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      if (!session) {
        setIsLoggedIn(false);
        setLoggedInUser(null);
        setUserRole(null);
        setUserIdentities([]);
      }
    });
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // Normalize products coming from Supabase to match local shape
  const normalizeProduct = (p) => ({
    id: p.id,
    name: p.name ?? '',
    price: Number(p.price ?? 0),
    category: p.category ?? '',
    image: p.image ?? 'https://placehold.co/400x400/EAE0D5/3D2C1D?text=Produk',
    description: p.description ?? '',
    owner: p.owner ?? '',
    featured: Boolean(p.featured ?? false),
    tags: Array.isArray(p.tags) ? p.tags : [],
    allergens: Array.isArray(p.allergens) ? p.allergens : [],
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.reviewCount ?? p.review_count ?? 0),
    soldCount: Number(p.soldCount ?? p.sold_count ?? 0),
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
    isAvailable: p.isAvailable ?? p.is_available ?? true,
    currentStock: Number(p.currentStock ?? p.current_stock ?? 0),
    stockHistory: Array.isArray(p.stockHistory) ? p.stockHistory : (p.stock_history ?? []),
  });

  // Helper: refetch products from API or Supabase
  const refetchProducts = async () => {
    try {
      // Prefer serverless API
      const resp = await fetch('/api/products');
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) {
          setProducts(list.map(normalizeProduct));
          return;
        }
      }
    } catch (_) {}
    // Fallback: direct supabase fetch
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });
        if (!error && Array.isArray(data)) {
          setProducts(data.map(normalizeProduct));
        }
      } catch (_) {}
    }
  };

  // Initial fetch attempt
  useEffect(() => {
    refetchProducts();
    refetchOrders();
    refetchPromotions();
  }, []);

  // Persist key states
  useEffect(() => { save('cart', cart); }, [cart]);
  useEffect(() => { save('wishlist', wishlist); }, [wishlist]);
  useEffect(() => { save('isLoggedIn', isLoggedIn); }, [isLoggedIn]);
  useEffect(() => { save('loggedInUser', loggedInUser); }, [loggedInUser]);
  useEffect(() => { save('userRole', userRole); }, [userRole]);
  useEffect(() => { save('appliedDiscount', appliedDiscount); }, [appliedDiscount]);
  useEffect(() => { save('partners', partners); }, [partners]);
  useEffect(() => { save('customerProfiles', customerProfiles); }, [customerProfiles]);

  const navigateTo = (pageId, options = {}) => {
    const { trackHistory = true, context = {} } = options;
    // Require login for certain pages
    if (!isLoggedIn) {
      const guarded = ['profile', 'cart', 'wishlist', 'checkout', 'order-history', 'address', 'settings'];
      if (guarded.includes(pageId)) pageId = 'auth';
    }

    if (trackHistory && pageHistory[pageHistory.length - 1] !== pageId) {
      setPageHistory(prev => [...prev, pageId]);
    }

    if (context.productId) {
      const product = products.find(p => p.id === context.productId);
      setSelectedProduct(product);
    }

    setCurrentPage(pageId);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop();
      setPageHistory(newHistory);
      setCurrentPage(newHistory[newHistory.length - 1]);
    } else {
      navigateTo('home');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const showToast = (message) => {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed bottom-24 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const addToCart = (productId, quantity) => {
    if (!isLoggedIn || !loggedInUser?.email) {
      showToast('Silakan login untuk menambahkan ke keranjang.');
      navigateTo('auth');
      return;
    }
    const product = products.find((p) => p.id === productId);
    setCart(prevCart => {
      const cartItem = prevCart.find((item) => item.id === productId);
      if (cartItem) {
        return prevCart.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: quantity }];
      }
    });
    showToast(`${quantity}x ${product.name} ditambahkan`);
  };

  const updateQuantity = (productId, change) => {
    if (!isLoggedIn || !loggedInUser?.email) {
      showToast('Silakan login untuk mengubah keranjang.');
      navigateTo('auth');
      return;
    }
    setCart(prevCart => {
      const cartItem = prevCart.find((item) => item.id === productId);
      if (cartItem) {
        const newQuantity = cartItem.quantity + change;
        if (newQuantity <= 0) {
          return prevCart.filter((item) => item.id !== productId);
        }
        return prevCart.map(item => 
          item.id === productId ? { ...item, quantity: newQuantity } : item
        );
      }
      return prevCart;
    });
  };

  const removeFromCart = (productId) => {
    if (!isLoggedIn || !loggedInUser?.email) {
      showToast('Silakan login untuk mengubah keranjang.');
      navigateTo('auth');
      return;
    }
    setCart(prevCart => prevCart.filter((item) => item.id !== productId));
  };

  const toggleWishlist = (productId) => {
    if (!loggedInUser || !loggedInUser.email) {
      showToast('Silakan login untuk menambahkan ke wishlist.');
      return;
    }

    const product = products.find((p) => p.id === productId);
    setWishlist(prevWishlist => {
      const updatedWishlist = prevWishlist.includes(productId)
        ? prevWishlist.filter(id => id !== productId)
        : [...prevWishlist, productId];

      // Update customer profile with favorite products
      setCustomerProfiles(prevProfiles => ({
        ...prevProfiles,
        [loggedInUser.email]: {
          ...(prevProfiles[loggedInUser.email] || {}),
          favoriteProducts: updatedWishlist,
        },
      }));

      if (prevWishlist.includes(productId)) {
        showToast(`${product.name} dihapus dari wishlist`);
      } else {
        showToast(`${product.name} ditambah ke wishlist`);
      }
      return updatedWishlist;
    });
  };

  const login = (email, name) => {
    if (email === 'admin@dapurmerifa.com') {
      setUserRole('admin');
      setAdminPage('dashboard');
      setLoggedInUser({ email, name: 'Admin' }); // Admin user
    } else {
      setUserRole('buyer');
      setLoggedInUser({ email, name }); // Buyer user
      // Load points for the logged-in buyer
      if (!customerPoints[email]) {
        setCustomerPoints(prev => ({ ...prev, [email]: 0 }));
      }
      // Load profile for the logged-in buyer
      if (!customerProfiles[email]) {
        setCustomerProfiles(prev => ({ ...prev, [email]: { favoriteProducts: [], shippingAddress: null, settings: { notifyEmail: true, notifyWhatsApp: false } } }));
      }
    }
    setIsLoggedIn(true);
    navigateTo('profile');
  };

  // Update shipping address for current user
  const saveShippingAddress = (addr) => {
    if (!loggedInUser?.email) { showToast('Silakan login.'); return; }
    setCustomerProfiles(prev => ({
      ...prev,
      [loggedInUser.email]: {
        ...(prev[loggedInUser.email] || {}),
        shippingAddress: addr,
      },
    }));
    showToast('Alamat tersimpan.');
  };

  // Update settings for current user
  const saveUserSettings = (settings) => {
    if (!loggedInUser?.email) { showToast('Silakan login.'); return; }
    setCustomerProfiles(prev => ({
      ...prev,
      [loggedInUser.email]: {
        ...(prev[loggedInUser.email] || {}),
        settings: { ...(prev[loggedInUser.email]?.settings || {}), ...settings },
      },
    }));
    showToast('Pengaturan disimpan.');
  };

  const logout = () => {
    (async () => {
      try {
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch {}
      setIsLoggedIn(false);
      setUserRole(null);
      setLoggedInUser(null);
      // Bersihkan token Supabase yang tersisa di storage agar tidak auto-login
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('sb-')) localStorage.removeItem(k);
        });
      } catch {}
      // Clear persisted auth data
      try {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedInUser');
      } catch {}
      navigateTo('auth');
    })();
  };

  const loginWithGoogle = () => {
    if (!supabase) {
      showToast('Konfigurasi Supabase belum tersedia');
      return;
    }
    try {
      // Gunakan URL aplikasi (Vite) agar tidak mendarat di port vercel dev (3000)
      const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;
      // paksa account picker agar tidak auto-login ke akun sebelumnya
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { prompt: 'select_account' } },
      });
    } catch (e) {
      console.error(e);
      showToast('Gagal membuka login Google');
    }
  };

  

  // Build Authorization header with Supabase access token
  const getAuthHeaders = async () => {
    const base = { 'Content-Type': 'application/json' };
    if (!supabase) return base;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      return token ? { ...base, Authorization: `Bearer ${token}` } : base;
    } catch (_) {
      return base;
    }
  };

  const signUpWithEmail = async (email, password, name) => {
    if (!supabase) {
      // fallback demo mode
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
      console.error(error);
      showToast(error.message || 'Gagal mendaftar');
      return { data: null, error };
    }
  };

  const signInWithEmail = async (email, password) => {
    if (!supabase) {
      // fallback demo mode
      login(email, 'Pengguna');
      return { data: null, error: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Berhasil masuk');
      return { data, error: null };
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Gagal masuk');
      return { data: null, error };
    }
  };

  const linkGoogle = async () => {
    if (!supabase) return showToast('Konfigurasi Supabase belum tersedia');
    try {
      const redirectTo = window.location.origin;
      if (typeof supabase.auth.linkIdentity === 'function') {
        await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } });
      } else {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal menghubungkan Google');
    }
  };

  const placeOrder = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 10000;
    let total = subtotal + shipping;

    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        total -= subtotal * appliedDiscount.discount;
      } else {
        total -= appliedDiscount.discount;
      }
    }

    const newOrderBase = {
      customer: loggedInUser ? loggedInUser.name : 'Pembeli Baru', // Use loggedInUser name
      customerEmail: loggedInUser ? loggedInUser.email : 'guest@example.com', // Store email
      items: [...cart],
      total: total > 0 ? total : 0,
      status: 'Menunggu Pembayaran',
      discount: appliedDiscount,
      date: new Date().toISOString().slice(0, 10), // Add current date
    };

    setAppliedDiscount(null); // Clear discount after placing order

    // Decrement stock for ordered items and add to stock history
    setProducts(prevProducts =>
      prevProducts.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          const newStock = product.currentStock - cartItem.quantity;
          const today = new Date().toISOString().slice(0, 10);
          const updatedStockHistory = [...product.stockHistory];

          const existingEntryIndex = updatedStockHistory.findIndex(entry => entry.date === today && entry.type === 'sale');

          if (existingEntryIndex !== -1) {
            updatedStockHistory[existingEntryIndex].quantity -= cartItem.quantity;
          } else {
            updatedStockHistory.push({ date: today, quantity: -cartItem.quantity, type: 'sale' });
          }

          return {
            ...product,
            currentStock: newStock >= 0 ? newStock : 0, // Ensure stock doesn't go negative
            stockHistory: updatedStockHistory,
          };
        }
        return product;
      })
    );
    // Add points to customer via API
    if (loggedInUser && loggedInUser.email) {
      const pointsEarned = Math.floor(total / 10000); // 1 point per 10,000 IDR
      if (pointsEarned > 0) {
        (async () => {
          try {
            const headers = await getAuthHeaders();
            await fetch('/api/loyalty', { method: 'POST', headers, body: JSON.stringify({ op: 'earn', amount: pointsEarned }) });
            // Refresh authoritative points from server ASAP
            try { await refetchLoyalty?.(); } catch (_) {}
          } catch (_) {}
        })();
        setCustomerPoints(prev => ({
          ...prev,
          [loggedInUser.email]: (prev[loggedInUser.email] || 0) + pointsEarned,
        }));
        showToast('Anda mendapatkan ' + pointsEarned + ' poin!');
      }
    }

    // Simpan ke server dan dapatkan ID berformat DM-00001
    (async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrderBase),
        });
        if (res.ok) {
          const saved = await res.json();
          setOrders(prev => [saved, ...prev]);
          setLastOrderDetails(saved);
        } else {
          // Fallback: generate client ID if API not available
          const fallbackId = `DM-${Date.now().toString().slice(-5).padStart(5, '0')}`;
          const newOrder = { id: fallbackId, ...newOrderBase };
          setOrders(prev => [newOrder, ...prev]);
          setLastOrderDetails(newOrder);
        }
      } catch (e) {
        const fallbackId = `DM-${Date.now().toString().slice(-5).padStart(5, '0')}`;
        const newOrder = { id: fallbackId, ...newOrderBase };
        setOrders(prev => [newOrder, ...prev]);
        setLastOrderDetails(newOrder);
      } finally {
        navigateTo('order-success');
      }
    })();
  };

  const backToHome = () => {
    setCart([]);
    setAppliedDiscount(null);
    setPointsDiscount(0);
    setPageHistory(['home']);
    navigateTo('home');
  };

  const addProduct = (productData) => {
    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const initialStock = productData.currentStock !== undefined ? Number(productData.currentStock) : 0;
        const priceNumber = productData.price !== undefined && productData.price !== '' ? Number(productData.price) : 0;
        const isAvailable = productData.isAvailable !== undefined ? Boolean(productData.isAvailable) : true;
        const featured = productData.featured !== undefined ? Boolean(productData.featured) : false;
        const payload = {
          ...productData,
          price: priceNumber,
          isAvailable,
          featured,
          rating: 0,
          reviewCount: 0,
          soldCount: 0,
          reviews: [],
          tags: productData.tags && productData.tags.length ? productData.tags : ["New"],
          currentStock: initialStock,
          stockHistory: [{ date: today, quantity: initialStock, type: 'initial' }],
        };
        const headers = await getAuthHeaders();
        const res = await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(errText || 'Gagal menambah produk');
        }
        // Tambahkan hasil dari server langsung ke state agar tampil instan
        try {
          const saved = await res.json();
          setProducts(prev => [normalizeProduct(saved), ...prev]);
        } catch (_) {
          // Jika parsing gagal, fallback ke refetch
          await refetchProducts();
        }
        showToast(`${productData.name} berhasil ditambahkan.`);
      } catch (e) {
        console.error(e);
        // Fallback lokal: buat ID baru dengan increment dari ID terbesar saat ini
        try {
          const maxId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
          const nextId = maxId + 1;
          const localProduct = normalizeProduct({ id: nextId, ...payload });
          setProducts(prev => [localProduct, ...prev]);
          showToast(`${productData.name} ditambahkan (lokal).`);
        } catch (_) {
          showToast('Gagal menambah produk. Cek nilai harga/stok dan API.');
        }
      }
    })();
  };

  const editProduct = (productId, updatedData) => {
    const prevSnapshot = products;
    const current = products.find(p => p.id === productId);
    if (!current) return;
    const optimistic = {
      ...current,
      ...updatedData,
      currentStock: updatedData.currentStock !== undefined ? Number(updatedData.currentStock) : current.currentStock,
      price: updatedData.price !== undefined && updatedData.price !== '' ? Number(updatedData.price) : current.price,
    };
    setProducts(prev => prev.map(p => (p.id === productId ? optimistic : p)));
    (async () => {
      try {
        const body = { id: productId, ...updatedData };
        if (body.price !== undefined && body.price !== '') body.price = Number(body.price);
        if (body.currentStock !== undefined) body.currentStock = Number(body.currentStock);
        const headers = await getAuthHeaders();
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(errText || 'Gagal memperbarui produk');
        }
        try {
          const saved = await res.json();
          setProducts(prev => prev.map(p => (p.id === productId ? normalizeProduct(saved) : p)));
        } catch (_) {
          // keep optimistic if body not returned
        }
        showToast(`${updatedData.name} berhasil diperbarui.`);
      } catch (e) {
        console.error(e);
        // revert
        setProducts(prevSnapshot);
        showToast('Gagal memperbarui produk. Perubahan dibatalkan.');
      }
    })();
  };

  const updateProductStock = (productId, addedQuantity) => {
    const prevSnapshot = products;
    const current = products.find(p => p.id === productId);
    if (!current) return;
    const add = Number(addedQuantity) || 0;
    const today = new Date().toISOString().slice(0, 10);
    const history = Array.isArray(current.stockHistory) ? [...current.stockHistory] : [];
    const idx = history.findIndex(e => e.date === today && e.type === 'addition');
    if (idx !== -1) history[idx] = { ...history[idx], quantity: Number(history[idx].quantity || 0) + add };
    else history.push({ date: today, quantity: add, type: 'addition' });
    const optimistic = { ...current, currentStock: current.currentStock + add, stockHistory: history };
    setProducts(prev => prev.map(p => (p.id === productId ? optimistic : p)));
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: productId, op: 'add_stock', addedQuantity: add }),
        });
        if (!res.ok) throw new Error('Gagal menambah stok');
        try {
          const saved = await res.json();
          setProducts(prev => prev.map(p => (p.id === productId ? normalizeProduct(saved) : p)));
        } catch (_) {}
        showToast('Stok produk diperbarui.');
      } catch (e) {
        console.error(e);
        setProducts(prevSnapshot);
        showToast('Gagal memperbarui stok. Perubahan dibatalkan.');
      }
    })();
  };

  const deleteProduct = (productId) => {
    const prevSnapshot = products;
    setProducts(prev => prev.filter(p => p.id !== productId));
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE', headers });
        if (res.status !== 204 && !res.ok) throw new Error('Gagal menghapus produk');
        showToast('Produk berhasil dihapus.');
      } catch (e) {
        console.error(e);
        setProducts(prevSnapshot);
        showToast('Gagal menghapus produk. Perubahan dibatalkan.');
      }
    })();
  };

  const redeemPoints = (pointsToRedeem) => {
    if (!loggedInUser || !loggedInUser.email) {
      showToast('Silakan login untuk menukarkan poin.');
      return 0;
    }
    const step = 50;
    // Ambil saldo poin terbaru: jika 0/tidak ada, coba fetch dari API dulu
    let balance = customerPoints[loggedInUser.email] || 0;
    const ensureBalance = async () => {
      if (balance > 0) return balance;
      try {
        const headers = await getAuthHeaders();
        const r = await fetch('/api/loyalty', { headers });
        if (r.ok) {
          const d = await r.json();
          if (typeof d.points === 'number') {
            balance = d.points;
            setCustomerPoints(prev => ({ ...prev, [loggedInUser.email]: d.points }));
          }
        }
      } catch (_) {}
      return balance;
    };
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    if (appliedDiscount) {
      discountAmount = appliedDiscount.type === 'percentage' ? subtotal * appliedDiscount.discount : appliedDiscount.discount;
    }
    const remainingCurrencyCap = Math.max(0, subtotal - discountAmount - (pointsDiscount || 0));
    const maxBySubtotalPoints = Math.floor(remainingCurrencyCap / 100);
    // hardCap dihitung setelah memastikan saldo terbaru
    // fungsi utama dijalankan di dalam IIFE async agar bisa await ensureBalance
    (async () => {})();
    // placeholder return; logika di bawah akan di-override oleh implementasi IIFE
    const run = async () => {
      await ensureBalance();
      const hardCap = Math.min(balance, maxBySubtotalPoints);
      let n = Math.floor(((Number(pointsToRedeem) || 0)) / step) * step;
      if (n < step) {
        showToast('Minimal penukaran 50 poin dan kelipatannya.');
        return 0;
      }
      const capped = Math.floor(hardCap / step) * step;
      if (capped <= 0) {
        if (subtotal <= 0) showToast('Keranjang kosong atau total belanja 0.');
        else if (balance <= 0) showToast('Poin tidak cukup.');
        else showToast('Melebihi nilai belanja yang bisa didiskon.');
        return 0;
      }
      if (n > capped) {
        n = capped;
        showToast(`Maksimal yang dapat ditukar: ${n} poin.`);
      }
      try {
        const headers = await getAuthHeaders();
        const resp = await fetch('/api/loyalty', { method: 'POST', headers, body: JSON.stringify({ op: 'redeem', amount: n }) });
        if (!resp.ok) {
          const msg = await resp.json().catch(() => ({}));
          showToast(msg && msg.message ? msg.message : 'Gagal menukarkan poin');
          return 0;
        }
        setCustomerPoints(prev => ({
          ...prev,
          [loggedInUser.email]: Math.max(0, (prev[loggedInUser.email] || 0) - n),
        }));
        setPointsDiscount((prev) => (prev || 0) + n * 100);
        const discountValue = n * 100;
        showToast(n + ' poin berhasil ditukarkan menjadi diskon ' + formatRupiah(discountValue) + '.');
        try { await refetchLoyalty?.(); } catch (_) {}
        return discountValue;
      } catch (e) {
        showToast('Gagal menukarkan poin');
        return 0;
      }
    };
    // jalankan dan kembalikan nilai estimasi agar UI cepat, nilai server tetap sinkron via toast/refetch
    run();
    // Estimasi diskon langsung (optimistik)
    let est = Math.floor(((Number(pointsToRedeem) || 0)) / step) * step;
    if (est < step) est = 0;
    return est * 100;
  };

  const resetPointsDiscount = () => {
    if (pointsDiscount > 0 && loggedInUser?.email) {
      const pointsToRefund = Math.floor((pointsDiscount || 0) / 100);
      (async () => {
        try {
          const headers = await getAuthHeaders();
          // Kembalikan poin ke saldo pengguna (refund)
          if (pointsToRefund > 0) {
            await fetch('/api/loyalty', {
              method: 'POST',
              headers,
              body: JSON.stringify({ op: 'earn', amount: pointsToRefund })
            });
            // Update cache lokal cepat
            setCustomerPoints(prev => ({
              ...prev,
              [loggedInUser.email]: (prev[loggedInUser.email] || 0) + pointsToRefund,
            }));
            try { await refetchLoyalty?.(); } catch (_) {}
          }
        } catch (_) {}
      })();
    }
    setPointsDiscount(0);
    showToast('Diskon poin dibatalkan & poin dikembalikan.');
  };

  const toggleProductAvailability = (productId) => {
    const current = products.find(p => p.id === productId);
    const nextVal = !(current?.isAvailable ?? true);
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: productId, isAvailable: nextVal }),
        });
        if (!res.ok) throw new Error('Gagal mengubah status');
        await refetchProducts();
        showToast('Status ketersediaan produk diperbarui.');
      } catch (e) {
        console.error(e);
        showToast('Gagal memperbarui status produk.');
      }
    })();
  };

  const addPromotion = (promoData) => {
    const prevSnapshot = promotions;
    setPromotions(prev => [...prev, promoData]);
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/promotions', {
          method: 'POST',
          headers,
          body: JSON.stringify(promoData),
        });
        if (!res.ok) throw new Error('Gagal menambah promo');
        // Sync list after success
        await refetchPromotions();
        showToast(`Kode promo ${promoData.code} berhasil ditambahkan.`);
      } catch (e) {
        console.error(e);
        setPromotions(prevSnapshot);
        showToast(`Gagal menambah promo. Perubahan dibatalkan.`);
      }
    })();
  };

  const deletePromotion = (promoCode) => {
    const prevSnapshot = promotions;
    setPromotions(prev => prev.filter(p => p.code !== promoCode));
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/promotions?code=${encodeURIComponent(promoCode)}`, { method: 'DELETE', headers });
        if (res.status !== 204 && !res.ok) throw new Error('Gagal menghapus promo');
        showToast(`Kode promo ${promoCode} berhasil dihapus.`);
      } catch (e) {
        console.error(e);
        setPromotions(prevSnapshot);
        showToast(`Gagal menghapus promo. Perubahan dibatalkan.`);
      }
    })();
  };

  // Partners (local-state; bisa dihubungkan ke DB bila diperlukan)
  const addPartner = (data) => {
    const nextId = partners.length ? Math.max(...partners.map(p => Number(p.id) || 0)) + 1 : 1;
    const newP = { id: nextId, ...data };
    setPartners(prev => [newP, ...prev]);
    showToast('Mitra ditambahkan.');
  };
  const editPartner = (id, data) => {
    setPartners(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
    showToast('Mitra diperbarui.');
  };
  const deletePartner = (id) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    showToast('Mitra dihapus.');
  };

  const applyDiscount = (code) => {
    const promo = promotions.find(p => p.code.toUpperCase() === code.toUpperCase());
    if (promo) {
      setAppliedDiscount(promo);
      showToast(`Kode promo ${promo.code} berhasil digunakan.`);
    } else {
      setAppliedDiscount(null);
      showToast('Kode promo tidak valid.');
    }
  };

  const exportOrdersToCsv = () => {
    const csvEscape = (value) => {
      if (value === null || value === undefined) return '';
      let stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = ["ID Order", "Customer", "Total", "Status", "Tanggal", "Produk"];
    const rows = orders.map(order => {
      const productList = order.items.map(item => `${item.name} (${item.quantity}x) @ ${formatRupiah(item.price)}`).join('; ');
      return [
        csvEscape(order.id),
        csvEscape(order.customer),
        csvEscape(order.total), 
        csvEscape(order.status),
        csvEscape(order.date),
        csvEscape(productList)
      ].join(',');
    });

    const csvContent = [headers.map(csvEscape).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'laporan_orderan_dapur_merifa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan orderan berhasil diunduh.');
  };

  // Fetch helpers
  const refetchOrders = async () => {
    try {
      const resp = await fetch('/api/orders');
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) setOrders(list);
      }
    } catch (_) {}
  };

  const refetchPromotions = async () => {
    try {
      const resp = await fetch('/api/promotions');
      if (resp.ok) {
        const list = await resp.json();
        if (Array.isArray(list)) setPromotions(list);
      }
    } catch (_) {}
  };

  // Fetch loyalty points for the current user
  const refetchLoyalty = async () => {
    if (!loggedInUser?.email) return;
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch('/api/loyalty', { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data.points === 'number') {
          setCustomerPoints(prev => ({ ...prev, [loggedInUser.email]: data.points }));
        }
      }
    } catch (_) {}
  };

  const value = {
    cart,
    wishlist,
    isLoggedIn,
    loggedInUser,
    userRole,
    adminPage,
    currentPage,
    pageHistory,
    lastOrderDetails,
    currentCategoryFilter,
    selectedProduct,
    products,
    orders,
    promotions,
    partners,
    customerPoints,
    customerProfiles,
    appliedDiscount,
    pointsDiscount,
    isLoading,
    navigateTo,
    goBack,
    formatRupiah,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleWishlist,
    updateOrderStatus,
    login,
    logout,
    placeOrder,
    backToHome,
    setCurrentCategoryFilter,
    setAdminPage,
    addProduct,
    editProduct,
    deleteProduct,
    toggleProductAvailability,
    updateProductStock,
    addPromotion,
    deletePromotion,
    addPartner,
    editPartner,
    deletePartner,
    applyDiscount,
    exportOrdersToCsv,
    redeemPoints,
    resetPointsDiscount,
    showToast,
    loginWithGoogle,
    saveShippingAddress,
    saveUserSettings,
    refetchLoyalty,
    getAuthHeaders,
    signUpWithEmail,
    signInWithEmail,
    linkGoogle,
    userIdentities,
    refetchProducts,
    refetchOrders,
    refetchPromotions
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
