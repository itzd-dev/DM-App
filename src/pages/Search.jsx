
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Search = () => {
  const { products, formatRupiah, addToCart, navigateTo } = useAppContext();
  const [query, setQuery] = useState('');

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const showProductDetail = (productId) => {
    navigateTo('product-detail', { context: { productId } });
  }

  return (
    <section id="page-search" className="page-section p-4">
      <div className="mb-4">
        <input
          type="text"
          id="main-search-input"
          placeholder="Ketik nama dimsum, nugget..."
          className="w-full px-4 py-3 border-2 border-brand-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary font-light text-sm"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div id="search-results-container">
        {query && filteredProducts.length > 0 && (
          <div className="space-y-3">
            {filteredProducts.map(product => {
              const soldText =
                product.soldCount >= 1000
                  ? `${(product.soldCount / 1000).toFixed(1).replace(".0", "")}rb+`
                  : product.soldCount;
              return (
                <div key={product.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-brand-subtle cursor-pointer" onClick={() => showProductDetail(product.id)}>
                  <img src={product.image} alt={product.name} className="w-16 h-16 rounded-md object-cover mr-4" />
                  <div className="flex-grow">
                    <h4 className="font-semibold text-sm text-brand-text">{product.name}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-brand-primary font-bold">{formatRupiah(product.price)}</p>
                      <div className="flex items-center space-x-1 text-brand-text-light">
                        <i className="fas fa-fire-alt text-orange-400 text-xs"></i>
                        <span className="text-xs font-bold">{soldText} terjual</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }} className="ml-3 bg-brand-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              )
            })}
          </div>
        )}
        {!query && (
          <div id="search-placeholder" className="text-center py-10">
            <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
            <p className="text-brand-text-light font-light text-sm">
              Cari produk favorit Anda.
            </p>
          </div>
        )}
        {query && filteredProducts.length === 0 && (
          <div id="search-no-results" className="text-center py-10">
            <i className="fas fa-box-open text-5xl text-gray-300 mb-4"></i>
            <p className="text-brand-text-light font-light text-sm">
              Produk tidak ditemukan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Search;
