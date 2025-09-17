
import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const Wishlist = () => {
  const { wishlist, products, formatRupiah, addToCart, navigateTo, setCurrentCategoryFilter } = useAppContext();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const showAllProducts = () => {
    setCurrentCategoryFilter(null);
    navigateTo('products');
  }

  const showProductDetail = (productId) => {
    navigateTo('product-detail', { context: { productId } });
  }

  return (
    <section id="page-wishlist" className="page-section p-4">
      {wishlist.length === 0 ? (
        <div id="empty-wishlist-message" className="text-center py-10">
          <i className="fas fa-heart text-5xl text-gray-300 mb-4"></i>
          <p className="text-brand-text-light font-light text-sm">
            Anda belum menyimpan produk favorit.
          </p>
          <button
            onClick={showAllProducts}
            className="mt-4 bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg text-sm"
          >
            Cari Produk
          </button>
        </div>
      ) : (
        <div id="wishlist-items" className="space-y-3">
          {wishlistedProducts.map(product => (
            <div key={product.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-brand-subtle">
              <img src={product.image} alt={product.name} className="w-16 h-16 rounded-md object-cover mr-4 cursor-pointer" onClick={() => showProductDetail(product.id)} />
              <div className="flex-grow cursor-pointer" onClick={() => showProductDetail(product.id)}>
                <h4 className="font-semibold text-sm text-brand-text">{product.name}</h4>
                <p className="text-sm text-brand-primary font-bold mt-1">{formatRupiah(product.price)}</p>
              </div>
              <button onClick={() => addToCart(product.id, 1)} className="ml-3 bg-brand-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Wishlist;
