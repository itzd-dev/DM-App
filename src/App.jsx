
import React from 'react';
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

// Admin Pages
import Dashboard from './pages/Dashboard';
import OrderManagement from './pages/OrderManagement';
import ProductManagement from './pages/ProductManagement';
import CustomerManagement from './pages/CustomerManagement';
import Promotions from './pages/Promotions';

const App = () => {
  const { currentPage, userRole, adminPage } = useAppContext();

  // Admin View
  if (userRole === 'admin') {
    const renderAdminPage = () => {
      switch (adminPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'orders':
          return <OrderManagement />;
        case 'products':
          return <ProductManagement />;
        case 'customers':
          return <CustomerManagement />;
        case 'promotions':
          return <Promotions />;
        default:
          return <Dashboard />;
      }
    };
    return <AdminLayout>{renderAdminPage()}</AdminLayout>;
  }

  // Buyer View
  const renderBuyerPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'products':
        return <Products />;
      case 'search':
        return <Search />;
      case 'wishlist':
        return <Wishlist />;
      case 'cart':
        return <Cart />;
      case 'product-detail':
        return <ProductDetail />;
      case 'checkout':
        return <Checkout />;
      case 'order-success':
        return <OrderSuccess />;
      case 'auth':
        return <Auth />;
      case 'profile':
        return <Profile />;
      default:
        return <Home />;
    }
  };

  return (
    <Layout>
      {renderBuyerPage()}
    </Layout>
  );
};

export default App;
