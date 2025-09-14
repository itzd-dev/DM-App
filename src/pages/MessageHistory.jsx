import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

// Riwayat pesan terhubung ke API /api/messages (Supabase auth)
const MessageHistory = () => {
  const { loggedInUser, getAuthHeaders } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = loggedInUser?.email || '-';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const headers = await (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {});
        const resp = await fetch('/api/messages?limit=50', { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (mounted) setMessages(Array.isArray(data.messages) ? data.messages : []);
        } else {
          if (mounted) setMessages([]);
        }
      } catch (_) {
        if (mounted) setMessages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [email]);

  return (
    <section id="page-message-history" className="page-section p-4">
      <h2 className="text-xl font-bold text-brand-primary mb-1">Riwayat Pesan</h2>
      <p className="text-xs text-brand-text-light mb-4">Untuk: {email}</p>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-sm text-brand-text-light">Memuat…</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-brand-text-light">Belum ada pesan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="border border-brand-subtle bg-white rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-brand-text">{m.title}</p>
                  <p className="text-xs text-brand-text-light">{new Date(m.created_at).toLocaleString('id-ID')} • {(m.type || '').toUpperCase()}</p>
                </div>
              </div>
              <p className="text-sm text-brand-text mt-2">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MessageHistory;
