import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const OrderHistory = () => {
  const { orders, loggedInUser, formatRupiah, getAuthHeaders, refetchOrders } = useAppContext();
  const [points, setPoints] = useState(null);
  const [openPts, setOpenPts] = useState(false);
  const [ptHistory, setPtHistory] = useState([]);
  const [loadingPtHistory, setLoadingPtHistory] = useState(false);
  const email = loggedInUser?.email;
  const name = loggedInUser?.name;

  const myOrders = (orders || []).filter(o => {
    if (!email) return true;
    if (o.customerEmail) return o.customerEmail === email;
    if (name && o.customer) return o.customer === name;
    return false;
  });

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
    try { refetchOrders?.(); } catch (_) {}
  }, [email]);

  // Lazy-load history when accordion opens
  useEffect(() => {
    if (!openPts) return;
    let mounted = true;
    (async () => {
      setLoadingPtHistory(true);
      try {
        const headers = await (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {});
        const resp = await fetch('/api/loyalty?history=1', { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (mounted) setPtHistory(Array.isArray(data.history) ? data.history : []);
        } else if (mounted) {
          setPtHistory([]);
        }
      } catch (_) {
        if (mounted) setPtHistory([]);
      } finally {
        if (mounted) setLoadingPtHistory(false);
      }
    })();
    return () => { mounted = false; };
  }, [openPts]);

  return (
    <section className="page-section p-4">
      <h2 className="text-xl font-bold text-brand-primary mb-4">Riwayat Pesanan</h2>

      {typeof points === 'number' && (
        <div className="bg-brand-bg rounded-lg border border-brand-subtle p-2 mb-3">
          <button type="button" className="w-full flex items-center justify-between" onClick={() => setOpenPts(v => !v)}>
            <span className="text-sm text-brand-text-light">Poin Sekarang</span>
            <span className="flex items-center gap-2">
              <span className="text-lg font-bold text-brand-primary">{points} Poin</span>
              <i className={`fas ${openPts ? 'fa-chevron-up' : 'fa-chevron-down'} text-brand-text-light text-xs`}></i>
            </span>
          </button>
          {openPts && (
            <div className="mt-2 bg-white border border-brand-subtle rounded-md p-2">
              {loadingPtHistory ? (
                <p className="text-xs text-brand-text-light">Memuat riwayat…</p>
              ) : (
                <div className="space-y-1">
                  {/* Reset redeem (lokal) */}
                  {(() => { const t = (typeof window !== 'undefined' && localStorage.getItem('lastPointsResetAt')) || null; return t ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-text-light">Reset redeem</span>
                      <span className="text-brand-text">{new Date(t).toLocaleString('id-ID')}</span>
                    </div>
                  ) : null; })()}
                  {/* Redeem history (server) */}
                  {ptHistory.filter(h => h.op === 'redeem').slice(0,5).map((h, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-brand-text-light">Tukar {h.amount} poin</span>
                      <span className="text-brand-text">{new Date(h.created_at).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  {ptHistory.filter(h => h.op === 'redeem').length === 0 && (
                    <p className="text-xs text-brand-text-light">Belum ada penukaran poin.</p>
                  )}
                </div>
              )}
            </div>
          )}
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
