
import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const Header = () => {
  const { currentPage, goBack, selectedProduct, navigateTo, cart, currentCategoryFilter } = useAppContext();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderHeaderContent = () => {
    switch (currentPage) {
      case 'product-detail':
        return (
          <>
            <button onClick={goBack} className="text-brand-text"><i className="fas fa-arrow-left text-lg"></i></button>
            <h2 className="text-lg font-semibold text-brand-primary truncate">{selectedProduct?.name}</h2>
            <div className="relative">
              <button className="text-brand-text-light" onClick={() => navigateTo('cart')}>
                <i className="fas fa-shopping-cart text-lg"></i>
                {totalItems > 0 && <span className="badge">{totalItems > 9 ? '9+' : totalItems}</span>}
              </button>
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
              <div className="w-8"></div>
            </>
          )
        }
        return <><h1 className="text-xl font-bold text-brand-primary">{title}</h1><div></div></>;
      case 'profile':
        return <><h1 className="text-xl font-bold text-brand-primary">Profil Saya</h1><div></div></>;
      case 'auth':
        return <><h1 className="text-xl font-bold text-brand-primary">Akun Saya</h1><div></div></>;
      case 'checkout':
        return (
          <>
            <button onClick={goBack} className="text-brand-text"><i className="fas fa-arrow-left text-lg"></i></button>
            <h2 className="text-lg font-semibold text-brand-primary">Pembayaran</h2>
            <div className="w-8"></div>
          </>
        );
      case 'order-success':
        return <><h1 className="text-xl font-bold text-brand-primary">Pesanan Berhasil</h1><div></div></>;
      case 'order-history':
        return (
          <>
            <button onClick={goBack} className="text-brand-text"><i className="fas fa-arrow-left text-lg"></i></button>
            <h2 className="text-lg font-semibold text-brand-primary">Riwayat Pesanan</h2>
            <div className="w-8"></div>
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
            </div>
          </>
        );
    }
  };

  return (
    <header
      id="header"
      className="sticky top-0 bg-white z-20 p-4 flex justify-between items-center shadow-md transition-all duration-300"
    >
      {renderHeaderContent()}
    </header>
  );
};

export default Header;
