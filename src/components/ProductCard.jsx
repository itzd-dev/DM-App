import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const ProductCard = ({ product }) => {
  const { formatRupiah, toggleWishlist, wishlist, addToCart, navigateTo } = useAppContext();

  const isWishlisted = wishlist.includes(product.id);
  const heartIconClass = isWishlisted ? 'fas text-red-500' : 'far text-white';

  const soldText =
    product.soldCount >= 1000
      ? `${(product.soldCount / 1000).toFixed(1).replace(".0", "")}rb+`
      : product.soldCount;

  const showProductDetail = () => {
    navigateTo('product-detail', { context: { productId: product.id } });
  }

  return (
    <div className="border border-brand-subtle rounded-lg overflow-hidden shadow-sm bg-white flex flex-col transform transition-transform duration-200 hover:-translate-y-1">
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full h-32 object-cover cursor-pointer" onClick={showProductDetail} />
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1">
          {product.tags.map(tag => {
            let bgColor = tag === "New" ? "bg-blue-500" : tag === "Best Seller" ? "bg-brand-accent" : "bg-gray-400";
            return <span key={tag} className={`product-badge ${bgColor}`}>{tag}</span>;
          })}
          {product.allergens && product.allergens.length > 0 && (
            <div title={`Mengandung Alergen: ${product.allergens.join(", ")}`}>
              <i className="fas fa-exclamation-triangle text-yellow-400 text-sm" style={{ filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.7))' }}></i>
            </div>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
          <i className={`${heartIconClass} fa-heart text-xs`}></i>
        </button>
      </div>
      <div className="p-3 flex-grow flex flex-col cursor-pointer" onClick={showProductDetail}>
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-sm text-brand-text truncate pr-2">{product.name}</h4>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <i className="fas fa-star text-yellow-400 text-xs"></i>
            <span className="text-xs font-bold text-brand-text-light">{product.rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex-grow"></div>
        <div className="flex justify-between items-center mt-2 mb-2">
          <p className="text-sm text-brand-primary font-bold">{formatRupiah(product.price)}</p>
          <div className="flex items-center space-x-1 text-brand-text-light">
            <i className="fas fa-fire-alt text-orange-400 text-xs"></i>
            <span className="text-xs font-bold">{soldText}</span>
          </div>
        </div>
      </div>
      <div className="p-3 pt-0">
        <button 
          onClick={() => addToCart(product.id, 1)}
          disabled={!product.isAvailable}
          className={`w-full text-white text-xs font-semibold py-2 rounded-lg transition-colors ${product.isAvailable ? 'bg-brand-primary hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}>
          <i className="fas fa-cart-plus mr-1"></i> {product.isAvailable ? 'Tambah' : 'Stok Habis'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
