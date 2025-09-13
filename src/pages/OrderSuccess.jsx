
import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const OrderSuccess = () => {
  const { lastOrderDetails, formatRupiah, backToHome } = useAppContext();

  const confirmViaWhatsapp = () => {
    const phoneNumber = "6281234567890"; // Ganti dengan nomor WhatsApp Dapur Merifa

    let message = `Halo Dapur Merifa,\nSaya ingin konfirmasi pesanan saya.\n\n`;
    message += `*Nomor Pesanan:* ${lastOrderDetails.id}\n`;
    message += `*Nama:* Nama Pengguna (Placeholder)\n\n`;
    message += `*Pesanan:*
`;
    lastOrderDetails.items.forEach((item) => {
      message += `- ${item.quantity}x ${item.name}\n`;
    });
    message += `\n*Total Pembayaran:* ${formatRupiah(lastOrderDetails.total)}\n\n`;
    message += `Terima kasih.`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  }

  if (!lastOrderDetails.id) {
    return (
      <section className="page-section p-4 text-center">
        <p>Informasi pesanan tidak ditemukan.</p>
        <button onClick={backToHome} className="w-full mt-2 text-brand-primary font-semibold py-3 rounded-lg text-sm">
          Kembali ke Beranda
        </button>
      </section>
    )
  }

  return (
    <section id="page-order-success" className="page-section p-4 text-center flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
        <i className="fas fa-check text-4xl text-green-600"></i>
      </div>
      <h2 className="text-xl font-bold text-brand-primary">Terima Kasih!</h2>
      <p className="text-brand-text-light mt-2 mb-4 text-sm">Pesanan Anda telah kami terima. Segera konfirmasi pembayaran Anda.</p>
      <div className="w-full text-left p-4 bg-brand-bg rounded-lg border border-brand-subtle mb-6">
        <h4 className="font-semibold text-brand-primary mb-2 text-md">Ringkasan</h4>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-brand-text-light">Nomor Pesanan</span>
          <span className="font-semibold text-brand-text">{lastOrderDetails.id}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-brand-text-light">Status</span>
          <span className="font-semibold text-yellow-600">Menunggu Pembayaran</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-brand-text-light">Total Pembayaran</span>
          <span className="font-bold text-brand-primary">{formatRupiah(lastOrderDetails.total)}</span>
        </div>
      </div>
      <button onClick={confirmViaWhatsapp} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition text-sm flex items-center justify-center">
        <i className="fab fa-whatsapp mr-2"></i> Konfirmasi via WhatsApp
      </button>
      <button onClick={backToHome} className="w-full mt-2 text-brand-primary font-semibold py-3 rounded-lg text-sm">
        Kembali ke Beranda
      </button>
    </section>
  );
};

export default OrderSuccess;
