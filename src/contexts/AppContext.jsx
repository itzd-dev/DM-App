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
  const [customerProfiles, setCustomerProfiles] = useState({
    'pengguna@email.com': { favoriteProducts: [1, 3] },
    'andi@example.com': { favoriteProducts: [6, 19] },
  });
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
  const [appliedDiscount, setAppliedDiscount] = useState(() => load('appliedDiscount', null));

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Simulate 1.5 second loading time
    return () => clearTimeout(timer);
  }, []);

  // Normalize products coming from Supabase to match local shape
  const normalizeProduct = (p) => ({
    id: p.id,
    name: p.name ?? '',
    price: Number(p.price ?? 0),
    category: p.category ?? '',
    image: p.image ?? 'https://placehold.co/400x400/EAE0D5/3D2C1D?text=Produk',
    description: p.description ?? '',
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
        if (Array.isArray(list) && list.length) {
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
        if (!error && Array.isArray(data) && data.length) {
          setProducts(data.map(normalizeProduct));
        }
      } catch (_) {}
    }
  };

  // Initial fetch attempt
  useEffect(() => {
    refetchProducts();
  }, []);

  // Persist key states
  useEffect(() => { save('cart', cart); }, [cart]);
  useEffect(() => { save('wishlist', wishlist); }, [wishlist]);
  useEffect(() => { save('isLoggedIn', isLoggedIn); }, [isLoggedIn]);
  useEffect(() => { save('loggedInUser', loggedInUser); }, [loggedInUser]);
  useEffect(() => { save('userRole', userRole); }, [userRole]);
  useEffect(() => { save('appliedDiscount', appliedDiscount); }, [appliedDiscount]);

  const navigateTo = (pageId, options = {}) => {
    const { trackHistory = true, context = {} } = options;

    if (pageId === 'profile' && !isLoggedIn) {
      pageId = 'auth';
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
          ...prevProfiles[loggedInUser.email],
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
        setCustomerProfiles(prev => ({ ...prev, [email]: { favoriteProducts: [] } }));
      }
    }
    setIsLoggedIn(true);
    navigateTo('profile');
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setLoggedInUser(null);
    // Clear persisted auth data
    try {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('loggedInUser');
    } catch {}
    navigateTo('auth');
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

    const orderId = `DM-${Date.now().toString().slice(-6)}`;

    const newOrder = {
      id: orderId,
      customer: loggedInUser ? loggedInUser.name : 'Pembeli Baru', // Use loggedInUser name
      customerEmail: loggedInUser ? loggedInUser.email : 'guest@example.com', // Store email
      items: [...cart],
      total: total > 0 ? total : 0,
      status: 'Menunggu Pembayaran',
      discount: appliedDiscount,
      date: new Date().toISOString().slice(0, 10), // Add current date
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setLastOrderDetails(newOrder);
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


    // Add points to customer
    if (loggedInUser && loggedInUser.email) {
      const pointsEarned = Math.floor(total / 10000); // 1 point per 10,000 IDR
      setCustomerPoints(prev => ({
        ...prev,
        [loggedInUser.email]: (prev[loggedInUser.email] || 0) + pointsEarned,
      }));
      if (pointsEarned > 0) {
        showToast(`Anda mendapatkan ${pointsEarned} poin!`);
      }
    }

    navigateTo('order-success');
  };

  const backToHome = () => {
    setCart([]);
    setAppliedDiscount(null);
    setPageHistory(['home']);
    navigateTo('home');
  };

  const addProduct = (productData) => {
    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const initialStock = productData.currentStock !== undefined ? Number(productData.currentStock) : 0;
        const payload = {
          ...productData,
          rating: 0,
          reviewCount: 0,
          soldCount: 0,
          reviews: [],
          tags: productData.tags && productData.tags.length ? productData.tags : ["New"],
          currentStock: initialStock,
          stockHistory: [{ date: today, quantity: initialStock, type: 'initial' }],
        };
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal menambah produk');
        await refetchProducts();
        showToast(`${productData.name} berhasil ditambahkan.`);
      } catch (e) {
        console.error(e);
        showToast('Gagal menambah produk.');
      }
    })();
  };

  const editProduct = (productId, updatedData) => {
    (async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId, ...updatedData, currentStock: Number(updatedData.currentStock) }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui produk');
        await refetchProducts();
        showToast(`${updatedData.name} berhasil diperbarui.`);
      } catch (e) {
        console.error(e);
        showToast('Gagal memperbarui produk.');
      }
    })();
  };

  const updateProductStock = (productId, addedQuantity) => {
    (async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId, op: 'add_stock', addedQuantity: Number(addedQuantity) }),
        });
        if (!res.ok) throw new Error('Gagal menambah stok');
        await refetchProducts();
        showToast('Stok produk diperbarui.');
      } catch (e) {
        console.error(e);
        showToast('Gagal memperbarui stok.');
      }
    })();
  };

  const deleteProduct = (productId) => {
    (async () => {
      try {
        const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE' });
        if (res.status !== 204 && !res.ok) throw new Error('Gagal menghapus produk');
        await refetchProducts();
        showToast('Produk berhasil dihapus.');
      } catch (e) {
        console.error(e);
        showToast('Gagal menghapus produk.');
      }
    })();
  };

  const redeemPoints = (pointsToRedeem) => {
    if (!loggedInUser || !loggedInUser.email) {
      showToast('Silakan login untuk menukarkan poin.');
      return 0;
    }
    const currentPoints = customerPoints[loggedInUser.email] || 0;
    if (currentPoints < pointsToRedeem) {
      showToast('Poin tidak cukup.');
      return 0;
    }

    const discountValue = pointsToRedeem * 100; // Example: 1 point = Rp 100 discount
    setCustomerPoints(prev => ({
      ...prev,
      [loggedInUser.email]: currentPoints - pointsToRedeem,
    }));
    showToast(`${pointsToRedeem} poin berhasil ditukarkan menjadi diskon ${formatRupiah(discountValue)}.`);
    return discountValue;
  };

  const toggleProductAvailability = (productId) => {
    const current = products.find(p => p.id === productId);
    const nextVal = !(current?.isAvailable ?? true);
    (async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
    setPromotions(prev => [...prev, promoData]);
    showToast(`Kode promo ${promoData.code} berhasil ditambahkan.`);
  };

  const deletePromotion = (promoCode) => {
    setPromotions(prev => prev.filter(p => p.code !== promoCode));
    showToast(`Kode promo ${promoCode} berhasil dihapus.`);
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
    customerPoints,
    customerProfiles,
    appliedDiscount,
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
    applyDiscount,
    exportOrdersToCsv,
    redeemPoints,
    showToast,
    refetchProducts
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
