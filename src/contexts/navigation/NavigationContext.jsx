import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCatalog } from '../catalog/CatalogContext';
import { useAuth } from '../auth/AuthContext';

const NavigationContext = createContext(null);

const GUARDED_ROUTES = new Set([
  '/profile',
  '/cart',
  '/wishlist',
  '/checkout',
  '/order/history',
  '/address',
  '/settings',
]);

const PAGE_TO_PATH = {
  home: '/',
  products: '/products',
  search: '/search',
  wishlist: '/wishlist',
  cart: '/cart',
  checkout: '/checkout',
  auth: '/auth',
  profile: '/profile',
  'order-history': '/order/history',
  address: '/address',
  settings: '/settings',
  'order-success': '/order/success',
};

const derivePageFromPath = (pathname) => {
  if (pathname === '/') return 'home';
  const entry = Object.entries(PAGE_TO_PATH).find(([, path]) => path === pathname);
  if (entry) return entry[0];
  if (pathname.startsWith('/product/')) return 'product-detail';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname === '/wishlist') return 'wishlist';
  return 'home';
};

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectProduct } = useCatalog();
  const { isLoggedIn } = useAuth();
  const [adminPageState, setAdminPageState] = useState('dashboard');

  const setAdminPage = useCallback((pageId, options = {}) => {
    const nextPage = pageId || 'dashboard';
    setAdminPageState(nextPage);
    const targetPath = nextPage === 'dashboard' ? '/admin/dashboard' : `/admin/${nextPage}`;
    navigate(targetPath, { replace: options.replace === true });
  }, [navigate]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      const segment = location.pathname.split('/')[2] || 'dashboard';
      setAdminPageState(segment);
    }
  }, [location.pathname]);

  const navigateTo = useCallback((path, options = {}) => {
    const { context = {} } = options;

    let nextPath = path;

    if (typeof nextPath === 'string' && !nextPath.startsWith('/')) {
      if (nextPath === 'product-detail') {
        const productId = context.productId ?? context.id;
        if (productId !== undefined && productId !== null) {
          selectProduct(Number(productId));
          nextPath = `/product/${productId}`;
        } else {
          nextPath = '/products';
        }
      } else {
        nextPath = PAGE_TO_PATH[nextPath] || '/';
      }
    }

    if (context.productId) {
      selectProduct(Number(context.productId));
    }

    if (typeof nextPath === 'string' && nextPath.startsWith('/product/')) {
      const productId = Number(nextPath.split('/').pop());
      if (!Number.isNaN(productId)) selectProduct(productId);
    }

    if (!isLoggedIn && GUARDED_ROUTES.has(nextPath)) {
      nextPath = '/auth';
    }

    navigate(nextPath);
    try {
      window.scrollTo(0, 0);
    } catch (error) {
      // ignore
    }
  }, [isLoggedIn, navigate, selectProduct]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const value = useMemo(() => ({
    currentPath: location.pathname,
    currentPage: derivePageFromPath(location.pathname),
    adminPage: adminPageState,
    setAdminPage,
    navigateTo,
    goBack,
  }), [location.pathname, adminPageState, navigateTo, goBack, setAdminPage]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
