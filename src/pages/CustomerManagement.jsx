import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/auth/AuthContext';
import { useUi } from '../contexts/ui/UiContext';

const CustomerManagement = () => {
  const { orders, formatRupiah, customerPoints, customerProfiles, products, userRole, fetchAllCustomerPoints } = useAppContext();
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { getAuthHeaders } = useAuth();
  const { showToast } = useUi();
  const [isUpdatingRole, setIsUpdatingRole] = useState(false); // State untuk loading button

  const handleSetRole = async (customerEmail, newRole) => {
    setIsUpdatingRole(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/setAdminRole', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ email: customerEmail, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(`Error: ${data.message}`, 'error');
        console.error('Error setting role:', data.message);
        return;
      }

      showToast(`Peran ${customerEmail} berhasil diubah menjadi ${newRole}.`, 'success');
      // Anda mungkin ingin me-refresh data pelanggan di sini jika diperlukan
      // fetchAllCustomerPoints(); // Jika ini juga me-refresh peran
    } catch (error) {
      showToast('Terjadi kesalahan tak terduga saat mengubah peran.', 'error');
      console.error('Network or unexpected error:', error);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAllCustomerPoints();
    }
  }, [userRole, fetchAllCustomerPoints]);

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

        {/* Role Management */}
        {userRole === 'admin' && ( // Hanya tampilkan jika pengguna saat ini adalah admin
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-semibold text-brand-text mb-2">Manajemen Peran</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSetRole(selectedCustomer.email, 'admin')}
                disabled={isUpdatingRole}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isUpdatingRole ? 'Memperbarui...' : 'Jadikan Admin'}
              </button>
              <button
                onClick={() => handleSetRole(selectedCustomer.email, 'buyer')}
                disabled={isUpdatingRole}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                {isUpdatingRole ? 'Memperbarui...' : 'Jadikan Pembeli Biasa'}
              </button>
            </div>
          </div>
        )}

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
