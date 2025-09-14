import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Admin = () => {
  const { logout, orders, updateOrderStatus, formatRupiah, refetchOrders, setAdminPage, showToast } = useAppContext();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Semua');

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      await refetchOrders();
      // Force rerender this view (optional safety)
      if (setAdminPage) setAdminPage('orders');
      if (showToast) showToast('Status pesanan diperbarui.');
    } catch (_) {
      // toast already handled in context
    } finally {
      setIsModalOpen(false);
      setSelectedOrder(null);
    }
  };

  // Sync with API on mount and poll periodically for fresh data
  useEffect(() => {
    let isMounted = true;
    const sync = async () => { try { await refetchOrders(); } catch (_) {} };
    sync();
    const timer = setInterval(() => { if (isMounted) sync(); }, 5000);
    return () => { isMounted = false; clearInterval(timer); };
  }, [refetchOrders]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran':
        return 'bg-yellow-100 text-yellow-800';
      case 'Diproses':
        return 'bg-blue-100 text-blue-800';
      case 'Dikirim':
        return 'bg-indigo-100 text-indigo-800';
      case 'Selesai':
        return 'bg-green-100 text-green-800';
      case 'Dibatalkan':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'Semua') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const chips = ['Semua','Menunggu Pembayaran','Diproses','Dikirim','Selesai','Dibatalkan'];

  return (
    <section id="page-admin-pos" className="page-section p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-brand-primary">Admin - Manajemen Order</h2>
        <button onClick={logout} className="text-sm font-semibold text-red-500">Logout</button>
      </div>

      {/* Filter chips (horizontal scroll on mobile) */}
      <div className="md:sticky md:top-16 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10 rounded-md border border-brand-subtle p-2 mb-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {chips.map(c => (
            <button key={c} onClick={() => setStatusFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium border ${statusFilter === c ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-text-light border-brand-subtle'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
        <h3 className="text-lg font-semibold text-brand-text mb-3">Daftar Orderan</h3>
        <div className="space-y-2">
          {filteredOrders.map(order => (
            <div key={order.id} onClick={() => handleOrderClick(order)} className="border border-brand-subtle rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-brand-bg">
              <div>
                <p className="font-bold text-brand-text">{order.id}</p>
                <p className="text-xs md:text-sm text-brand-text-light">{order.customer}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-primary">{formatRupiah(order.total)}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-5 md:p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-brand-primary mb-2">Detail Order: {selectedOrder.id}</h3>
            <p className="text-sm text-brand-text-light mb-2">Customer: {selectedOrder.customer}</p>
            <p className="text-xs text-brand-text-light mb-4">Status: <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusClass(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
            
            <div className="border-t border-b border-brand-subtle py-2 my-2 space-y-2">
              {selectedOrder.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <p className="text-brand-text">{item.quantity}x {item.name}</p>
                  <p className="text-brand-text-light">{formatRupiah(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-brand-text mb-4">
              <p>Total</p>
              <p>{formatRupiah(selectedOrder.total)}</p>
            </div>

            <h4 className="text-md font-semibold text-brand-text mb-3">Ubah Status Pesanan</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => handleStatusChange('Diproses')} className="bg-blue-500 text-white px-4 h-11 rounded-lg text-sm">Diproses</button>
              <button onClick={() => handleStatusChange('Dikirim')} className="bg-indigo-500 text-white px-4 h-11 rounded-lg text-sm">Dikirim</button>
              <button onClick={() => handleStatusChange('Selesai')} className="bg-green-500 text-white px-4 h-11 rounded-lg text-sm">Selesai</button>
              <button onClick={() => handleStatusChange('Dibatalkan')} className="bg-red-500 text-white px-4 h-11 rounded-lg text-sm">Dibatalkan</button>
            </div>

            <button onClick={() => setIsModalOpen(false)} className="w-full mt-4 text-center text-gray-500 text-sm">Tutup</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Admin;
