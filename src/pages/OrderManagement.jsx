import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import OrderManagementSkeleton from '../components/OrderManagementSkeleton';
import Button from '../components/ui/Button';

const Admin = () => {
  const { logout, orders, updateOrderStatus, formatRupiah, refetchOrders, setAdminPage, showToast, ordersLoading, updatingOrderId } = useAppContext();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      await refetchOrders();
      if (setAdminPage) setAdminPage('orders');
      if (showToast) showToast('Status pesanan diperbarui.');
    } catch (_) {
      // toast already handled in context
    } finally {
      setIsModalOpen(false);
      setSelectedOrder(null);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    refetchOrders();
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
        <h2 className="text-xl font-bold text-brand-primary dark:text-amber-200">Admin - Manajemen Order</h2>
        <Button onClick={logout} variant="danger" className="text-sm px-3 py-1.5">Logout</Button>
      </div>

      <div className="sticky top-16 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10 rounded-md border border-brand-subtle p-2 mb-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {chips.map(c => (
            <button key={c} onClick={() => setStatusFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium border ${statusFilter === c ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-text-light border-brand-subtle'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {ordersLoading ? <OrderManagementSkeleton /> : (
        <div className="bg-white dark:bg-[#1f1812] rounded-lg shadow-md p-3 border border-transparent dark:border-white/10">
          <h3 className="text-lg font-semibold text-brand-text mb-3">Daftar Orderan</h3>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-brand-text-light">
              <p className="font-medium">Belum ada order dengan filter ini.</p>
              <p className="text-sm mt-1">Order baru akan muncul di sini setelah pelanggan melakukan checkout.</p>
            </div>
          ) : (
          <div className="space-y-2">
            {filteredOrders.map(order => {
              const isUpdatingOrder = updatingOrderId === order.id;
              return (
                <div key={order.id} onClick={() => handleOrderClick(order)} className={`border border-brand-subtle dark:border-white/10 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-brand-bg dark:hover:bg-[#241b15] transition-transform ${isUpdatingOrder ? 'opacity-50 animate-pulse' : 'hover:-translate-y-1'}`}>
                  <div>
                    <p className="font-bold text-brand-text">{order.id}</p>
                    <p className="text-xs text-brand-text-light">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-primary">{formatRupiah(order.total)}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClass(order.status)}`}>
                      {isUpdatingOrder ? 'Menyimpan...' : order.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </div>
      )}

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md">
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
              <Button onClick={() => handleStatusChange('Diproses')} variant="info" className="h-11" disabled={isUpdating}>
                {isUpdating ? 'Menyimpan…' : 'Diproses'}
              </Button>
              <Button onClick={() => handleStatusChange('Dikirim')} variant="purple" className="h-11" disabled={isUpdating}>
                {isUpdating ? 'Menyimpan…' : 'Dikirim'}
              </Button>
              <Button onClick={() => handleStatusChange('Selesai')} variant="success" className="h-11" disabled={isUpdating}>
                {isUpdating ? 'Menyimpan…' : 'Selesai'}
              </Button>
              <Button onClick={() => handleStatusChange('Dibatalkan')} variant="danger" className="h-11" disabled={isUpdating}>
                {isUpdating ? 'Menyimpan…' : 'Dibatalkan'}
              </Button>
            </div>

            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="w-full mt-4">Tutup</Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Admin;
