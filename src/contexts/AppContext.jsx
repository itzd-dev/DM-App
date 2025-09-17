import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './auth/AuthContext';
import { useCatalog } from './catalog/CatalogContext';
import { useCart } from './cart/CartContext';
import { useOrders } from './orders/OrdersContext';
import { usePromotions } from './promotions/PromotionContext';
import { usePartners } from './partners/PartnerContext';
import { useUserData } from './user/UserContext';
import { useNavigation } from './navigation/NavigationContext';
import { useUi } from './ui/UiContext';
import { formatRupiah } from '../utils/format';

const AppContext = createContext(null);

export const LegacyAppProvider = ({ children }) => {
  const auth = useAuth();
  const catalog = useCatalog();
  const navigation = useNavigation();
  const cart = useCart();
  const orders = useOrders();
  const promotions = usePromotions();
  const partners = usePartners();
  const userData = useUserData();
  const ui = useUi();

  const value = useMemo(() => ({
    // Auth
    authReady: auth.authReady,
    isLoggedIn: auth.isLoggedIn,
    loggedInUser: auth.loggedInUser,
    userRole: auth.userRole,
    userIdentities: auth.userIdentities,
    login: auth.login,
    logout: auth.logout,
    loginWithGoogle: auth.loginWithGoogle,
    signInWithEmail: auth.signInWithEmail,
    signUpWithEmail: auth.signUpWithEmail,
    linkGoogle: auth.linkGoogle,
    getAuthHeaders: auth.getAuthHeaders,

    // Navigation
    currentPage: navigation.currentPage,
    navigateTo: navigation.navigateTo,
    goBack: navigation.goBack,
    adminPage: navigation.adminPage,
    setAdminPage: navigation.setAdminPage,

    // Catalog
    products: catalog.products,
    isLoading: catalog.isLoading,
    currentCategoryFilter: catalog.currentCategoryFilter,
    setCurrentCategoryFilter: catalog.setCurrentCategoryFilter,
    selectedProduct: catalog.selectedProduct,
    selectProduct: catalog.selectProduct,
    refetchProducts: catalog.refetchProducts,
    addProduct: catalog.addProduct,
    editProduct: catalog.editProduct,
    deleteProduct: catalog.deleteProduct,
    toggleProductAvailability: catalog.toggleProductAvailability,
    updateProductStock: catalog.updateProductStock,

    // Cart & wishlist
    cart: cart.cart,
    setCart: cart.setCart,
    wishlist: cart.wishlist,
    setWishlist: cart.setWishlist,
    addToCart: cart.addToCart,
    updateQuantity: cart.updateQuantity,
    removeFromCart: cart.removeFromCart,
    toggleWishlist: cart.toggleWishlist,
    appliedDiscount: cart.appliedDiscount,
    setAppliedDiscount: cart.setAppliedDiscount,
    applyDiscount: cart.applyDiscount,
    pointsDiscount: cart.pointsDiscount,
    setPointsDiscount: cart.setPointsDiscount,
    redeemPoints: cart.redeemPoints,
    resetPointsDiscount: cart.resetPointsDiscount,

    // Orders
    orders: orders.orders,
    setOrders: orders.setOrders,
    ordersLoading: orders.ordersLoading,
    updatingOrderId: orders.updatingOrderId,
    lastOrderDetails: orders.lastOrderDetails,
    setLastOrderDetails: orders.setLastOrderDetails,
    refetchOrders: orders.refetchOrders,
    updateOrderStatus: orders.updateOrderStatus,
    placeOrder: orders.placeOrder,
    backToHome: orders.backToHome,
    exportOrdersToCsv: orders.exportOrdersToCsv,

    // Promotions
    promotions: promotions.promotions,
    addPromotion: promotions.addPromotion,
    deletePromotion: promotions.deletePromotion,
    refetchPromotions: promotions.refetchPromotions,

    // Partners
    partners: partners.partners,
    addPartner: partners.addPartner,
    editPartner: partners.editPartner,
    deletePartner: partners.deletePartner,
    refetchPartners: partners.refetchPartners,

    // User data
    customerPoints: userData.customerPoints,
    setCustomerPoints: userData.setCustomerPoints,
    customerProfiles: userData.customerProfiles,
    setCustomerProfiles: userData.setCustomerProfiles,
    saveShippingAddress: userData.saveShippingAddress,
    saveUserSettings: userData.saveUserSettings,
    refetchLoyalty: userData.refetchLoyalty,
    fetchUserState: userData.fetchUserState,
    persistUserState: userData.persistUserState,
    initialCart: userData.initialCart,
    initialWishlist: userData.initialWishlist,
    userStateReady: userData.userStateReady,

    // Utilities
    showToast: ui.showToast,
    theme: ui.theme,
    toggleTheme: ui.toggleTheme,
    formatRupiah,
  }), [
    auth,
    catalog,
    navigation,
    cart,
    orders,
    promotions,
    partners,
    userData,
    ui,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within LegacyAppProvider');
  }
  return context;
};
