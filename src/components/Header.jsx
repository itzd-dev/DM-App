
import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const Header = () => {
  const { currentPage, goBack, selectedProduct, navigateTo, cart, currentCategoryFilter, theme, toggleTheme } = useAppContext();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="text-brand-text-light dark:text-amber-200 transition-transform hover:scale-110"
      aria-label="Toggle theme"
    >
      <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
    </button>
  );

  const renderHeaderContent = () => {
    switch (currentPage) {
      case 'product-detail':
        return (
          <>
            <button onClick={goBack} className="text-brand-text"><i className="fas fa-arrow-left text-lg"></i></button>
            <h2 className="text-lg font-semibold text-brand-primary truncate">{selectedProduct?.name}</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button className="text-brand-text-light" onClick={() => navigateTo('cart')}>
                  <i className="fas fa-shopping-cart text-lg"></i>
                  {totalItems > 0 && <span className="badge">{totalItems > 9 ? '9+' : totalItems}</span>}
                </button>
              </div>
              <ThemeToggle />
            </div>
          </>
        );
      case 'cart':
      case 'wishlist':
      case 'search':
      case 'products':
        let title = "Semua Produk";
        if (currentPage === 'cart') title = "Keranjang";
        if (currentPage === 'wishlist') title = "Wishlist";
        if (currentPage === 'search') title = "Pencarian";
        if (currentPage === 'products' && currentCategoryFilter) title = currentCategoryFilter;

        if (currentPage === 'wishlist' || currentPage === 'products') {
          return (
            <>
              <button onClick={goBack} className="text-brand-text"><i className="fas fa-arrow-left text-lg"></i></button>
              <h2 className="text-lg font-semibold text-brand-primary">{title}</h2>
              <ThemeToggle />
            </>
          )
        }
        return <><h1 className="text-xl font-bold text-brand-primary">{title}</h1><ThemeToggle /></>;
      case 'profile':
        return <><h1 className="text-xl font-bold text-brand-primary">Profil Saya</h1><ThemeToggle /></>;
      case 'auth':
        return <><h1 className="text-xl font-bold text-brand-primary">Akun Saya</h1><ThemeToggle /></>;
      case 'checkout':
        return (
          <>
            <button onClick={goBack} className="text-brand-text"><i className="fas fa-arrow-left text-lg"></i></button>
            <h2 className="text-lg font-semibold text-brand-primary">Pembayaran</h2>
            <ThemeToggle />
          </>
        );
      case 'order-success':
        return <><h1 className="text-xl font-bold text-brand-primary">Pesanan Berhasil</h1><ThemeToggle /></>;
      case 'order-history':
        return (
          <>
            <button onClick={goBack} className="text-brand-text"><i className="fas fa-arrow-left text-lg"></i></button>
            <h2 className="text-lg font-semibold text-brand-primary">Riwayat Pesanan</h2>
            <ThemeToggle />
          </>
        );
      default: // home
        return (
          <>
            <h1 className="text-xl font-bold text-brand-primary">Dapur Merifa</h1>
            <div className="flex items-center space-x-4">
              <button className="text-brand-text-light" onClick={() => navigateTo('search')}>
                <i className="fas fa-search text-lg"></i>
              </button>
              <div className="relative">
                <button className="text-brand-text-light" onClick={() => navigateTo('cart')}>
                  <i className="fas fa-shopping-cart text-lg"></i>
                  {totalItems > 0 && <span className="badge">{totalItems > 9 ? '9+' : totalItems}</span>}
                </button>
              </div>
              <ThemeToggle />
            </div>
          </>
        );
    }
  };

  return (
    <header
      id="header"
      className="sticky top-0 bg-white dark:bg-[#20160f] z-20 p-4 flex justify-between items-center shadow-md transition-all duration-300"
    >
      {renderHeaderContent()}
    </header>
  );
};

export default Header;
