import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, formatRupiah, navigateTo, setCurrentCategoryFilter, applyDiscount, appliedDiscount, pointsDiscount, resetPointsDiscount, loggedInUser, customerPoints, redeemPoints, getAuthHeaders } = useAppContext();
  const [promoCode, setPromoCode] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [apiPoints, setApiPoints] = useState(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 10000;
  
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      discountAmount = subtotal * appliedDiscount.discount;
    } else {
      discountAmount = appliedDiscount.discount;
    }
  }

  const total = subtotal + shipping - discountAmount - (pointsDiscount || 0);

  // fetch current points when cart mounts
  useEffect(() => {
    (async () => {
      try {
        const headers = await (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {});
        const r = await fetch('/api/loyalty', { headers });
        if (r.ok) {
          const d = await r.json();
          if (typeof d.points === 'number') setApiPoints(d.points);
        }
      } catch (_) {}
    })();
  }, []);

  const currentPoints = apiPoints !== null ? apiPoints : (loggedInUser?.email ? (customerPoints[loggedInUser.email] || 0) : 0);

  const showAllProducts = () => {
    setCurrentCategoryFilter(null);
    navigateTo('products');
  }

  const handleApplyCode = () => {
    if (promoCode) {
      applyDiscount(promoCode);
    }
  }

  return (
    <section id="page-cart" className="page-section p-4">
      {cart.length === 0 ? (
        <div id="empty-cart-message" className="text-center py-10">
          <i className="fas fa-shopping-cart text-5xl text-gray-300 mb-4"></i>
          <p className="text-brand-text-light font-light text-sm">
            Keranjang Anda masih kosong.
          </p>
          <button
            onClick={showAllProducts}
            className="mt-4 bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg text-sm"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <>
          <div id="cart-items" className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-brand-subtle">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover mr-4" />
                <div className="flex-grow">
                  <h4 className="font-semibold text-sm text-brand-text">{item.name}</h4>
                  <p className="text-xs text-brand-text-light">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-brand-subtle rounded-full font-bold text-sm text-brand-primary">-</button>
                  <span className="font-semibold text-sm text-brand-text">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-brand-subtle rounded-full font-bold text-sm text-brand-primary">+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="ml-3 text-red-500 hover:text-red-700">
                  <i className="fas fa-trash-alt text-sm"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="mt-6">
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Masukkan kode promo"
                className="w-full px-4 py-2 border-2 border-brand-subtle rounded-lg text-sm"
              />
              <button onClick={handleApplyCode} className="bg-brand-primary text-white font-semibold px-4 rounded-lg text-sm">Terapkan</button>
            </div>
          </div>

          {/* Loyalty Redeem in Cart */}
          <div className="mt-4 p-4 bg-brand-bg rounded-lg border border-brand-subtle">
            <h3 className="text-base font-semibold mb-2 text-brand-primary">Poin Loyalitas</h3>
            <div className="flex items-center mb-2">
              <span className="text-sm text-brand-text-light">Poin Anda</span>
              <span className="ml-2 text-sm font-semibold text-brand-text">{currentPoints}</span>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pointsToRedeem}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') return setPointsToRedeem('');
                  if (/^\d+$/.test(v)) setPointsToRedeem(v);
                }}
                onBlur={() => {
                  if (pointsToRedeem === '') return;
                  let n = parseInt(pointsToRedeem, 10) || 0;
                  n = Math.floor(n / 50) * 50;
                  setPointsToRedeem(n > 0 ? String(n) : '');
                }}
                placeholder="Masukkan poin (kelipatan 50)"
                className="w-full px-4 py-2 border-2 border-brand-subtle rounded-lg text-sm"
              />
              <button onClick={() => { const d = redeemPoints(parseInt(pointsToRedeem||'0',10)); if (d>0) setPointsToRedeem(''); }} className="bg-brand-primary text-white font-semibold px-4 rounded-lg text-sm">Tukar</button>
            </div>
            <p className="text-xs text-brand-text-light mt-1">50 poin = Rp 5.000, kelipatan 50</p>
          </div>

          <div id="cart-summary" className="mt-4 p-4 bg-brand-bg rounded-lg border border-brand-subtle">
            <h3 className="text-base font-semibold mb-2 text-brand-primary">Ringkasan Pesanan</h3>
            <div className="flex justify-between mb-1">
              <span className="text-brand-text-light font-light text-sm">Subtotal</span>
              <span className="font-medium text-brand-text text-sm">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-brand-text-light font-light text-sm">Ongkos Kirim</span>
              <span className="font-medium text-brand-text text-sm">{formatRupiah(shipping)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between mb-4 text-green-600">
                <span className="font-light text-sm">Diskon ({appliedDiscount.code})</span>
                <span className="font-medium text-sm">-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between mb-4 text-green-600">
                <span className="font-light text-sm">Diskon Poin</span>
                <span className="font-medium text-sm">-{formatRupiah(pointsDiscount)}</span>
              </div>
            )}
            <div className="border-t border-brand-subtle pt-4 flex justify-between">
              <span className="text-base font-semibold text-brand-text">Total</span>
              <span className="font-bold text-lg text-brand-primary">{formatRupiah(total > 0 ? total : 0)}</span>
            </div>
            {pointsDiscount > 0 && (
              <button onClick={resetPointsDiscount} className="w-full mt-3 bg-white border border-brand-subtle text-brand-text font-medium py-2 rounded-lg text-xs">
                Reset Diskon Poin
              </button>
            )}
            <button onClick={() => navigateTo('checkout')} className="w-full mt-4 bg-brand-accent text-white font-bold py-2.5 rounded-lg hover:bg-opacity-90 transition text-sm">
              Lanjutkan ke Pembayaran
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default Cart;
