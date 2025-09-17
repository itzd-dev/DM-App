
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';

// Layouts
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Buyer Pages
import Home from './pages/Home';
import Products from './pages/Products';
import Search from './pages/Search';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import Address from './pages/Address';
import Settings from './pages/Settings';

// Admin Pages
import Dashboard from './pages/Dashboard';
import OrderManagement from './pages/OrderManagement';
import ProductManagement from './pages/ProductManagement';
import CustomerManagement from './pages/CustomerManagement';
import Promotions from './pages/Promotions';
import Partners from './pages/Partners';

const BuyerShell = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const AdminShell = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);

const RequireAuth = ({ children }) => {
  const { isLoggedIn } = useAppContext();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
};

const RequireAdmin = ({ children }) => {
  const { userRole } = useAppContext();
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRedirect = () => {
  const { isLoggedIn, userRole } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn && userRole === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoggedIn, userRole, navigate, location.pathname]);

  return null;
};

const App = () => (
  <>
    <AdminRedirect />
    <Routes>
      <Route element={<BuyerShell />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="search" element={<Search />} />
        <Route
          path="wishlist"
          element={(
            <RequireAuth>
              <Wishlist />
            </RequireAuth>
          )}
        />
        <Route
          path="cart"
          element={(
            <RequireAuth>
              <Cart />
            </RequireAuth>
          )}
        />
        <Route path="product/:productId" element={<ProductDetail />} />
        <Route
          path="checkout"
          element={(
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          )}
        />
        <Route path="order/success" element={<OrderSuccess />} />
        <Route path="auth" element={<Auth />} />
        <Route
          path="profile"
          element={(
            <RequireAuth>
              <Profile />
            </RequireAuth>
          )}
        />
        <Route
          path="order/history"
          element={(
            <RequireAuth>
              <OrderHistory />
            </RequireAuth>
          )}
        />
        <Route
          path="address"
          element={(
            <RequireAuth>
              <Address />
            </RequireAuth>
          )}
        />
        <Route
          path="settings"
          element={(
            <RequireAuth>
              <Settings />
            </RequireAuth>
          )}
        />
      </Route>

      <Route
        path="admin"
        element={(
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        )}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="partners" element={<Partners />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default App;
