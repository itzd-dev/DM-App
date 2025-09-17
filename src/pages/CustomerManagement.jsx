import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';

const CustomerManagement = () => {
  const { orders, formatRupiah, customerPoints, customerProfiles, products } = useAppContext();
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const customers = useMemo(() => {
    const customerData = {};
    orders.forEach(order => {
      const email = order.customerEmail || 'guest@example.com';
      const name = order.customer || 'Pembeli Baru';

      if (!customerData[email]) {
        customerData[email] = {
          email: email,
          name: name,
          orderCount: 0,
          totalSpent: 0,
          orders: [],
        };
      }
      customerData[email].orderCount++;
      customerData[email].totalSpent += order.total;
      customerData[email].orders.push(order);
    });
    return Object.values(customerData).sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  const getCustomerPoints = (email) => customerPoints[email] || 0;
  const getCustomerFavoriteProducts = (email) => {
    const profile = customerProfiles[email];
    return profile?.favoriteProducts?.map(id => products.find(p => p.id === id)).filter(Boolean) || [];
  };

  if (selectedCustomer) {
    const favoriteProducts = getCustomerFavoriteProducts(selectedCustomer.email);
    return (
      <div>
        <button onClick={() => setSelectedCustomer(null)} className="text-sm font-semibold text-brand-primary mb-4">
          &larr; Kembali ke Daftar Pelanggan
        </button>
        <h2 className="text-2xl font-bold text-brand-primary mb-1">{selectedCustomer.name}</h2>
        <p className="text-brand-text-light mb-6">{selectedCustomer.email} &bull; Total Pesanan: {selectedCustomer.orderCount} &bull; Total Belanja: {formatRupiah(selectedCustomer.totalSpent)}</p>
        
        {/* Customer Points */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-semibold text-brand-text mb-2">Poin Loyalitas</h3>
          <p className="text-2xl font-bold text-brand-primary">{getCustomerPoints(selectedCustomer.email)} Poin</p>
        </div>

        {/* Favorite Products */}
        {favoriteProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-semibold text-brand-text mb-2">Produk Favorit</h3>
            <div className="grid grid-cols-3 gap-3">
              {favoriteProducts.map(product => (
                <div key={product.id} className="flex flex-col items-center text-center">
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-md mb-1" />
                  <p className="text-xs font-medium text-brand-text truncate w-full">{product.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-brand-text mb-3">Riwayat Orderan</h3>
          <div className="space-y-3">
            {selectedCustomer.orders.map(order => (
              <div key={order.id} className="border border-brand-subtle rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-brand-text">{order.id}</p>
                    <p className="text-sm text-brand-text-light">Status: {order.status}</p>
                  </div>
                  <p className="font-bold text-brand-primary">{formatRupiah(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-primary mb-6">Manajemen Pelanggan</h2>
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="space-y-3">
          {customers.map(customer => (
            <div key={customer.email} onClick={() => setSelectedCustomer(customer)} className="border border-brand-subtle rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-brand-bg">
              <div>
                <p className="font-bold text-brand-text">{customer.name}</p>
                <p className="text-sm text-brand-text-light">{customer.email}</p>
                <p className="text-xs text-brand-text-light">{customer.orderCount} pesanan</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">{formatRupiah(customer.totalSpent)}</p>
                <p className="text-sm text-brand-primary">{getCustomerPoints(customer.email)} Poin</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;