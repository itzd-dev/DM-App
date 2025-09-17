
import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const BottomNav = () => {
  const { navigateTo, currentPage, cart, setCurrentCategoryFilter } = useAppContext();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const showAllProducts = () => {
    setCurrentCategoryFilter(null);
    navigateTo('products');
  }

  const navItems = [
    { id: 'home', icon: 'fa-home', label: 'Home', onClick: () => navigateTo('home') },
    { id: 'products', icon: 'fa-box-open', label: 'Produk', onClick: showAllProducts },
    { id: 'search', icon: 'fa-search', label: 'Cari', onClick: () => navigateTo('search') },
    { id: 'cart', icon: 'fa-shopping-cart', label: 'Keranjang', onClick: () => navigateTo('cart') },
    { id: 'profile', icon: 'fa-user', label: 'Profil', onClick: () => navigateTo('profile') },
  ];

  let activePage = currentPage;
  if (currentPage === 'auth') activePage = 'profile';
  if (currentPage === 'product-detail') activePage = 'products';


  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white flex justify-around max-w-[480px] w-full mx-auto z-10 border-t border-brand-subtle">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={`nav-button flex-1 py-3 text-center ${activePage === item.id ? 'text-brand-primary' : 'text-brand-text-light'}`}>
          {item.id === 'cart' ? (
            <div className="relative inline-block">
              <i className={`fas ${item.icon} text-lg`}></i>
              {totalItems > 0 && <span id="cart-badge-nav" className="badge">{totalItems > 9 ? '9+' : totalItems}</span>}
            </div>
          ) : (
            <i className={`fas ${item.icon} text-lg`}></i>
          )}
          <span className={`block text-xs ${activePage === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
