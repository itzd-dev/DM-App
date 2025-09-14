import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const OrderHistory = () => {
  const { orders, loggedInUser, formatRupiah, getAuthHeaders } = useAppContext();
  const [points, setPoints] = useState(null);
  const email = loggedInUser?.email;

  const myOrders = (orders || []).filter(o => !email || o.customerEmail === email);

  useEffect(() => {
    (async () => {
      try {
        const headers = await (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {});
        const resp = await fetch('/api/loyalty', { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (typeof data.points === 'number') setPoints(data.points);
        }
      } catch (_) {}
    })();
  }, [email]);

  return (
    <section className="page-section p-4">
      <h2 className="text-xl font-bold text-brand-primary mb-4">Riwayat Pesanan</h2>

      {typeof points === 'number' && (
        <div className="bg-brand-bg rounded-lg border border-brand-subtle p-3 mb-3 flex items-center justify-between">
          <span className="text-sm text-brand-text-light">Poin Sekarang</span>
          <span className="text-lg font-bold text-brand-primary">{points} Poin</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-brand-subtle p-3">
        {myOrders.length === 0 ? (
          <p className="text-sm text-brand-text-light">Belum ada pesanan.</p>
        ) : (
          <div className="space-y-2">
            {myOrders.map(order => (
              <div key={order.id} className="border border-brand-subtle rounded-md p-3">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <p className="font-bold text-brand-text">{order.id}</p>
                    <p className="text-xs text-brand-text-light">{order.date} • {order.status}</p>
                  </div>
                  <p className="font-bold text-brand-primary">{formatRupiah(order.total)}</p>
                </div>
                <div className="text-xs text-brand-text-light">
                  {(order.items || []).slice(0,3).map(i => `${i.quantity}x ${i.name}`).join(', ')}{(order.items || []).length > 3 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderHistory;
