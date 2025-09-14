import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const OrderHistory = () => {
  const { orders, loggedInUser, formatRupiah, getAuthHeaders } = useAppContext();
  const [history, setHistory] = useState([]);
  const email = loggedInUser?.email;

  const myOrders = (orders || []).filter(o => !email || o.customerEmail === email);

  useEffect(() => {
    (async () => {
      try {
        const headers = await (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {});
        const resp = await fetch('/api/loyalty?history=1', { headers });
        if (resp.ok) {
          const data = await resp.json();
          setHistory(Array.isArray(data.history) ? data.history : []);
        }
      } catch (_) {}
    })();
  }, [email]);

  return (
    <section className="page-section p-4">
      <h2 className="text-xl font-bold text-brand-primary mb-4">Riwayat Pesanan</h2>

      {history.length > 0 && (
        <div className="bg-brand-bg rounded-lg border border-brand-subtle p-4 mb-4">
          <h3 className="font-semibold text-brand-primary mb-2">Riwayat Poin</h3>
          <div className="space-y-2 text-sm">
            {history.map((h, idx) => (
              <details key={idx} className="group border border-brand-subtle rounded-md bg-white overflow-hidden">
                <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between">
                  <span className="text-brand-text-light">
                    {new Date(h.created_at).toLocaleString('id-ID')} • {h.op === 'earn' ? 'Dapat' : 'Tukar'} {h.amount}
                  </span>
                  <span className="text-brand-text font-medium">{h.points_before} → {h.points_after}</span>
                </summary>
                <div className="px-3 pb-3 pt-0 text-brand-text-light grid grid-cols-2 gap-y-1">
                  <span>Operasi</span><span className="text-brand-text">{h.op === 'earn' ? 'Dapat Poin' : 'Tukar Poin'}</span>
                  <span>Jumlah</span><span className="text-brand-text">{h.amount}</span>
                  <span>Sebelum</span><span className="text-brand-text">{h.points_before}</span>
                  <span>Sesudah</span><span className="text-brand-text">{h.points_after}</span>
                  <span>Waktu</span><span className="text-brand-text">{new Date(h.created_at).toLocaleString('id-ID')}</span>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-brand-subtle p-4">
        {myOrders.length === 0 ? (
          <p className="text-sm text-brand-text-light">Belum ada pesanan.</p>
        ) : (
          <div className="space-y-3">
            {myOrders.map(order => (
              <div key={order.id} className="border border-brand-subtle rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <p className="font-bold text-brand-text">{order.id}</p>
                    <p className="text-xs text-brand-text-light">{order.date} • {order.status}</p>
                  </div>
                  <p className="font-bold text-brand-primary">{formatRupiah(order.total)}</p>
                </div>
                <div className="text-sm text-brand-text-light">
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
