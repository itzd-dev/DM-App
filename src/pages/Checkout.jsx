import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Checkout = () => {
  const { cart, formatRupiah, placeOrder, appliedDiscount, pointsDiscount } = useAppContext();
  const [paymentMethod, setPaymentMethod] = useState('qris');

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

  return (
    <section id="page-checkout" className="page-section p-4">
      <div className="mb-4">
        <h3 className="text-md font-semibold text-brand-primary mb-2">Alamat Pengiriman</h3>
        <div className="p-4 bg-brand-bg rounded-lg border border-brand-subtle text-sm">
          <p className="font-bold text-brand-text">Nama Pengguna</p>
          <p className="text-brand-text-light">Jl. Merdeka No. 123, Kota Bahagia, 12345</p>
          <a href="#" className="text-brand-accent font-semibold text-xs mt-1 inline-block">Ganti Alamat</a>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-md font-semibold text-brand-primary mb-2">Ringkasan Pesanan</h3>
        <div id="checkout-item-summary" className="space-y-2 border-b border-brand-subtle pb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-brand-text-light">{item.quantity}x {item.name}</span>
              <span className="text-brand-text font-medium">{formatRupiah(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 pt-4">
            <div className="flex justify-between mb-1">
              <span className="text-brand-text-light font-light text-sm">Subtotal</span>
              <span className="font-medium text-brand-text text-sm">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-brand-text-light font-light text-sm">Ongkos Kirim</span>
              <span className="font-medium text-brand-text text-sm">{formatRupiah(shipping)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-green-600">
                <span className="font-light text-sm">Diskon ({appliedDiscount.code})</span>
                <span className="font-medium text-sm">-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="font-light text-sm">Diskon Poin</span>
                <span className="font-medium text-sm">-{formatRupiah(pointsDiscount)}</span>
              </div>
            )}
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold text-brand-primary mb-2">Pilih Metode Pembayaran</h3>
        <div className="space-y-3">
          <div id="method-qris" onClick={() => setPaymentMethod('qris')} className={`payment-method border-2 border-brand-subtle p-4 rounded-lg cursor-pointer ${paymentMethod === 'qris' ? 'selected' : ''}`}>
            <h4 className="font-bold text-brand-text">QRIS</h4>
            <p className="text-xs text-brand-text-light">Pembayaran instan melalui QR code.</p>
          </div>
          <div id="method-bank" onClick={() => setPaymentMethod('bank')} className={`payment-method border-2 border-brand-subtle p-4 rounded-lg cursor-pointer ${paymentMethod === 'bank' ? 'selected' : ''}`}>
            <h4 className="font-bold text-brand-text">Transfer Bank (Manual)</h4>
            <p className="text-xs text-brand-text-light">Transfer ke rekening bank kami.</p>
          </div>
        </div>
      </div>

      {paymentMethod === 'qris' && (
        <div id="qris-details" className="mt-4 p-4 bg-brand-bg rounded-lg border border-brand-subtle">
          <p className="text-center text-sm font-semibold text-brand-text mb-2">Scan untuk Membayar</p>
          <img src="https://placehold.co/200x200/FFFFFF/3D2C1D?text=QRIS" alt="QRIS Code" className="mx-auto rounded-md" />
          <p className="text-center font-bold text-lg text-brand-primary mt-2">{formatRupiah(total > 0 ? total : 0)}</p>
        </div>
      )}

      {paymentMethod === 'bank' && (
        <div id="bank-details" className="mt-4 p-4 bg-brand-bg rounded-lg border border-brand-subtle">
          <p className="text-sm font-semibold text-brand-text mb-2">Silakan transfer ke salah satu rekening berikut:</p>
          <div className="space-y-2 text-sm">
            <p><span className="font-bold">BCA:</span> 1234-5678-90 a/n Dapur Merifa</p>
            <p><span className="font-bold">Mandiri:</span> 109-8765-4321 a/n Dapur Merifa</p>
          </div>
          <p className="text-xs text-brand-text-light mt-2">Total pembayaran: <span className="font-bold text-brand-text">{formatRupiah(total > 0 ? total : 0)}</span></p>
          <p className="text-xs text-red-600 mt-2">Penting: Mohon transfer sesuai total untuk mempercepat verifikasi.</p>
        </div>
      )}

      <div className="sticky bottom-0 bg-white py-3 mt-4 border-t">
         <div className="flex justify-between items-center mb-2 px-4">
            <span className="text-base font-semibold text-brand-text">Total</span>
            <span className="font-bold text-xl text-brand-primary">{formatRupiah(total > 0 ? total : 0)}</span>
         </div>
        <div className="px-4">
          <button onClick={placeOrder} className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition text-sm">
              Selesaikan Pesanan
          </button>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
