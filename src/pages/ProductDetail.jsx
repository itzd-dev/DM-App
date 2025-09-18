import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const ProductDetail = () => {
  const { selectedProduct, selectProduct, products, formatRupiah, addToCart } = useAppContext();
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productId) {
      selectProduct(Number(productId));
    }
  }, [productId, selectProduct]);

  const product = useMemo(() => {
    if (selectedProduct) return selectedProduct;
    if (!productId) return null;
    return products.find((item) => item.id === Number(productId)) || null;
  }, [productId, products, selectedProduct]);

  if (!product) {
    return (
      <section className="page-section p-4">
        <p>Produk tidak ditemukan.</p>
      </section>
    );
  }

  const { name, price, image, tags, rating, reviewCount, soldCount, description, allergens, reviews, isAvailable } = product;

  const soldText =
    soldCount >= 1000
      ? `${(soldCount / 1000).toFixed(1).replace(".0", "")}rb+`
      : soldCount;

  const renderStars = (val) => {
    const items = [];
    for (let i = 1; i <= 5; i++) {
      items.push(
        <i key={i} className={`fas fa-star ${i <= Math.round(val) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
      );
    }
    return items;
  };

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
  }

  return (
    <section id="page-product-detail" className="page-section">
      <img src={image} alt={name} className="w-full h-64 object-cover" />
      <div className="max-w-[420px] mx-auto px-5 py-6 sm:px-6">
        <div className="flex space-x-2 mb-2">
          {tags.map((tag) => {
            const bgColor = tag === 'New' ? 'bg-blue-500' : tag === 'Best Seller' ? 'bg-brand-accent' : 'bg-gray-400';
            return (
              <span key={tag} className={`product-badge ${bgColor}`}>{tag}</span>
            );
          })}
        </div>
        <h2 className="text-2xl font-bold text-brand-text">{name}</h2>
        <div className="flex items-center space-x-4 my-2 text-sm text-brand-text-light">
          <div className="flex items-center space-x-1">
            <i className="fas fa-star text-yellow-400"></i>
            <span className="font-bold text-brand-text">{rating.toFixed(1)}</span>
            <span>({reviewCount} ulasan)</span>
          </div>
          <div className="flex items-center space-x-1">
            <i className="fas fa-fire-alt text-orange-400"></i>
            <span className="font-bold text-brand-text">{soldText}</span>
            <span>terjual</span>
          </div>
        </div>
        <p className="text-2xl text-brand-primary font-bold my-2">{formatRupiah(price)}</p>

        <div className="mt-4 pt-4 border-t border-brand-subtle">
          <h3 className="font-semibold text-brand-text mb-2">Deskripsi Produk</h3>
          <p className="text-brand-text-light text-sm leading-relaxed">{description}</p>
        </div>

        {allergens && allergens.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-brand-text mb-2">Informasi Alergen</h3>
            <div className="flex flex-wrap gap-2 bg-yellow-50 border border-yellow-300 rounded-xl p-3 shadow-sm">
              <i className="fas fa-exclamation-triangle text-yellow-600 text-base" aria-hidden="true"></i>
              <div className="flex flex-wrap gap-2">
                {allergens.map((item) => (
                  <span key={item} className="text-xs font-medium text-yellow-800 bg-white border border-yellow-200 rounded-full px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-brand-subtle">
          <h3 className="font-semibold text-brand-text mb-4">Ulasan Pelanggan ({reviewCount})</h3>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div key={index} className="flex items-start space-x-3 mb-4">
                <img src={`https://placehold.co/40x40/EAE0D5/3D2C1D?text=${review.name.charAt(0)}`} className="w-10 h-10 rounded-full flex-shrink-0" alt="Avatar" />
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm text-brand-text">{review.name}</p>
                    <p className="text-xs text-brand-text-light">{review.date}</p>
                  </div>
                  <div className="text-xs my-1 text-yellow-400 space-x-0.5">{renderStars(review.rating)}</div>
                  <p className="text-sm text-brand-text-light">{review.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-text-light text-center py-4 bg-brand-bg rounded-lg">Belum ada ulasan untuk produk ini.</p>
          )}
          {reviews.length > 0 && (
            <button className="text-sm font-semibold text-brand-primary w-full text-center py-2 mt-2 bg-brand-bg border border-brand-subtle rounded-lg">Lihat semua ulasan</button>
          )}
        </div>
      </div>

      <div className="sticky bottom-[76px] bg-white border-t border-brand-subtle">
        <div className="max-w-[420px] mx-auto flex items-center justify-between py-4 px-5 sm:px-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 bg-brand-subtle rounded-full font-bold text-lg text-brand-primary">-</button>
            <span id="detail-quantity" className="font-semibold text-lg text-brand-text">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 bg-brand-subtle rounded-full font-bold text-lg text-brand-primary">+</button>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`flex-grow ml-4 text-white font-bold py-3 rounded-lg transition text-sm ${isAvailable ? 'bg-brand-accent hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}>
            {isAvailable ? 'Tambah ke Keranjang' : 'Stok Habis'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;
