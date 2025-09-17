import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigation } from '../navigation/NavigationContext';
import { useCatalog } from '../catalog/CatalogContext';
import { usePromotions } from '../promotions/PromotionContext';
import { useUi } from '../ui/UiContext';
import { useUserData } from '../user/UserContext';
import { safeLoad, safeSave } from '../../utils/storage';

const CartContext = createContext(null);

const CART_KEY = 'cart';
const WISHLIST_KEY = 'wishlist';
const DISCOUNT_KEY = 'appliedDiscount';

export const CartProvider = ({ children }) => {
  const { isLoggedIn, loggedInUser, getAuthHeaders } = useAuth();
  const { navigateTo } = useNavigation();
  const { products } = useCatalog();
  const { promotions } = usePromotions();
  const { showToast } = useUi();
  const {
    customerPoints,
    setCustomerPoints,
    customerProfiles,
    setCustomerProfiles,
    refetchLoyalty,
    initialCart,
    initialWishlist,
    userStateReady,
    persistUserState,
  } = useUserData();

  const [cart, setCart] = useState(() => safeLoad(CART_KEY, []));
  const [wishlist, setWishlist] = useState(() => safeLoad(WISHLIST_KEY, []));
  const [appliedDiscount, setAppliedDiscount] = useState(() => safeLoad(DISCOUNT_KEY, null));
  const [pointsDiscount, setPointsDiscount] = useState(0);

  const hasSyncedRemoteRef = useRef(false);
  const allowPersistRef = useRef(false);

  useEffect(() => safeSave(CART_KEY, cart), [cart]);
  useEffect(() => safeSave(WISHLIST_KEY, wishlist), [wishlist]);
  useEffect(() => safeSave(DISCOUNT_KEY, appliedDiscount), [appliedDiscount]);

  useEffect(() => {
    if (!userStateReady) return;
    if (!isLoggedIn || !loggedInUser?.email) {
      hasSyncedRemoteRef.current = false;
      allowPersistRef.current = false;
      setCart(safeLoad(CART_KEY, []));
      setWishlist(safeLoad(WISHLIST_KEY, []));
      return;
    }
    if (!hasSyncedRemoteRef.current) {
      const remoteCart = Array.isArray(initialCart) ? initialCart : [];
      const remoteWishlist = Array.isArray(initialWishlist) ? initialWishlist : [];
      setCart(remoteCart);
      setWishlist(remoteWishlist);
      hasSyncedRemoteRef.current = true;
      safeSave(CART_KEY, remoteCart);
      safeSave(WISHLIST_KEY, remoteWishlist);
      setTimeout(() => {
        allowPersistRef.current = true;
      }, 0);
    }
  }, [userStateReady, isLoggedIn, loggedInUser?.email, initialCart, initialWishlist]);

  useEffect(() => {
    if (!allowPersistRef.current) return;
    if (!isLoggedIn || !loggedInUser?.email) return;
    persistUserState({ cart });
  }, [cart, isLoggedIn, loggedInUser?.email, persistUserState]);

  useEffect(() => {
    if (!allowPersistRef.current) return;
    if (!isLoggedIn || !loggedInUser?.email) return;
    persistUserState({ wishlist });
  }, [wishlist, isLoggedIn, loggedInUser?.email, persistUserState]);

  const ensureLoggedIn = useCallback(() => {
    if (!isLoggedIn || !loggedInUser?.email) {
      showToast('Silakan login untuk melanjutkan.');
      navigateTo('auth');
      return false;
    }
    return true;
  }, [isLoggedIn, loggedInUser?.email, navigateTo, showToast]);

  const addToCart = useCallback((productId, quantity) => {
    if (!ensureLoggedIn()) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === productId);
      if (existing) {
        return prevCart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...prevCart, { ...product, quantity }];
    });
    showToast(`${quantity}x ${product.name} ditambahkan`);
  }, [ensureLoggedIn, products, showToast]);

  const updateQuantity = useCallback((productId, change) => {
    if (!ensureLoggedIn()) return;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === productId);
      if (!existing) return prevCart;
      const nextQty = existing.quantity + change;
      if (nextQty <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) => (item.id === productId ? { ...item, quantity: nextQty } : item));
    });
  }, [ensureLoggedIn]);

  const removeFromCart = useCallback((productId) => {
    if (!ensureLoggedIn()) return;
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, [ensureLoggedIn]);

  const toggleWishlist = useCallback((productId) => {
    if (!ensureLoggedIn()) return;
    const product = products.find((p) => p.id === productId);
    const exists = wishlist.includes(productId);
    const updated = exists ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
    setWishlist(updated);

    if (loggedInUser?.email) {
      const nextProfile = {
        ...(customerProfiles[loggedInUser.email] || {}),
        favoriteProducts: updated,
      };
      setCustomerProfiles((prev) => ({
        ...prev,
        [loggedInUser.email]: nextProfile,
      }));
      persistUserState({ profiles: { [loggedInUser.email]: nextProfile } });
    }

    if (product) {
      showToast(exists ? `${product.name} dihapus dari wishlist` : `${product.name} ditambah ke wishlist`);
    }
  }, [ensureLoggedIn, wishlist, loggedInUser?.email, products, setCustomerProfiles, showToast, persistUserState, customerProfiles]);

  const applyDiscount = useCallback((code) => {
    const found = promotions.find((promo) => promo.code.toUpperCase() === code.toUpperCase());
    if (!found) {
      showToast('Kode promo tidak ditemukan.');
      return;
    }
    setAppliedDiscount(found);
    showToast(`Kode promo ${found.code} diterapkan.`);
  }, [promotions, showToast]);

  const redeemPoints = useCallback((pointsToRedeem) => {
    if (!ensureLoggedIn()) return 0;
    const email = loggedInUser?.email;
    if (!email) return 0;

    const step = 50;
    let balance = customerPoints[email] || 0;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = appliedDiscount
      ? appliedDiscount.type === 'percentage'
        ? subtotal * appliedDiscount.discount
        : appliedDiscount.discount
      : 0;
    const remainingCurrencyCap = Math.max(0, subtotal - discountAmount - (pointsDiscount || 0));
    const maxBySubtotalPoints = Math.floor(remainingCurrencyCap / 100);

    const run = async () => {
      if (balance <= 0) {
        try {
          const headers = await getAuthHeaders();
          const resp = await fetch('/api/loyalty', { headers });
          if (resp.ok) {
            const data = await resp.json();
            if (typeof data.points === 'number') {
              balance = data.points;
              setCustomerPoints((prev) => ({ ...prev, [email]: data.points }));
            }
          }
        } catch (error) {
          console.warn('[cart] redeemPoints balance fetch failed', error);
        }
      }

      const hardCap = Math.min(balance, maxBySubtotalPoints);
      let n = Math.floor(((Number(pointsToRedeem) || 0)) / step) * step;
      if (n < step) {
        showToast('Minimal penukaran 50 poin dan kelipatannya.');
        return;
      }
      const capped = Math.floor(hardCap / step) * step;
      if (capped <= 0) {
        if (subtotal <= 0) showToast('Keranjang kosong atau total belanja 0.');
        else if (balance <= 0) showToast('Poin tidak cukup.');
        else showToast('Melebihi nilai belanja yang bisa didiskon.');
        return;
      }
      if (n > capped) {
        n = capped;
        showToast(`Maksimal yang dapat ditukar: ${n} poin.`);
      }
      try {
        const headers = await getAuthHeaders();
        const resp = await fetch('/api/loyalty', {
          method: 'POST',
          headers,
          body: JSON.stringify({ op: 'redeem', amount: n }),
        });
        if (!resp.ok) {
          const msg = await resp.json().catch(() => ({}));
          showToast(msg && msg.message ? msg.message : 'Gagal menukarkan poin');
          return;
        }
        setCustomerPoints((prev) => ({
          ...prev,
          [email]: Math.max(0, (prev[email] || 0) - n),
        }));
        setPointsDiscount((prev) => (prev || 0) + n * 100);
        showToast(`${n} poin berhasil ditukarkan.`);
        try {
          await refetchLoyalty();
        } catch (error) {
          console.warn('[cart] redeemPoints refetchLoyalty failed', error);
        }
      } catch (error) {
        console.error('[cart] redeemPoints failed', error);
        showToast('Gagal menukarkan poin');
      }
    };

    run();
    let optimistic = Math.floor(((Number(pointsToRedeem) || 0)) / step) * step;
    if (optimistic < step) optimistic = 0;
    return optimistic * 100;
  }, [ensureLoggedIn, loggedInUser?.email, customerPoints, cart, appliedDiscount, pointsDiscount, getAuthHeaders, setCustomerPoints, refetchLoyalty, showToast]);

  const resetPointsDiscount = useCallback(() => {
    if (pointsDiscount > 0 && loggedInUser?.email) {
      const pointsToRefund = Math.floor((pointsDiscount || 0) / 100);
      (async () => {
        try {
          const headers = await getAuthHeaders();
          if (pointsToRefund > 0) {
            await fetch('/api/loyalty', {
              method: 'POST',
              headers,
              body: JSON.stringify({ op: 'earn', amount: pointsToRefund }),
            });
            setCustomerPoints((prev) => ({
              ...prev,
              [loggedInUser.email]: (prev[loggedInUser.email] || 0) + pointsToRefund,
            }));
            try {
              await refetchLoyalty();
            } catch (error) {
              console.warn('[cart] resetPointsDiscount refetchLoyalty failed', error);
            }
          }
        } catch (error) {
          console.warn('[cart] resetPointsDiscount failed', error);
        }
      })();
    }
    setPointsDiscount(0);
    try {
      window.localStorage.setItem('lastPointsResetAt', new Date().toISOString());
    } catch (error) {
      // ignore
    }
    showToast('Diskon poin dibatalkan & poin dikembalikan.');
  }, [pointsDiscount, loggedInUser?.email, getAuthHeaders, setCustomerPoints, refetchLoyalty, showToast]);

  const value = useMemo(() => ({
    cart,
    setCart,
    wishlist,
    setWishlist,
    appliedDiscount,
    setAppliedDiscount,
    pointsDiscount,
    setPointsDiscount,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleWishlist,
    applyDiscount,
    redeemPoints,
    resetPointsDiscount,
  }), [
    cart,
    wishlist,
    appliedDiscount,
    pointsDiscount,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleWishlist,
    applyDiscount,
    redeemPoints,
    resetPointsDiscount,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
