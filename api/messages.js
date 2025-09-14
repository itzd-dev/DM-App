// dapurmerifa/api/messages.js
// API Riwayat Pesan per pengguna (berdasarkan token Supabase)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const requireUser = async (req, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ message: 'Unauthorized' });
    return data.user;
  } catch (_e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const user = await requireUser(req, res);
    if (!user?.id) return; // response already sent
    const uid = user.id;

    const limit = Math.min(Math.max(parseInt(req.query?.limit || '50', 10) || 50, 1), 100);
    const type = (req.query?.type || '').toString().trim(); // optional filter

    // Tabel yang diharapkan: user_messages
    // Kolom minimal: id (uuid), user_id (uuid), type (text), title (text), body (text), created_at (timestamptz)
    let query = supabase
      .from('user_messages')
      .select('id,type,title,body,created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) {
      // Jika tabel belum ada atau error lain, jangan hard-fail; kembalikan kosong agar UI tetap jalan
      return res.status(200).json({ messages: [] });
    }
    return res.status(200).json({ messages: Array.isArray(data) ? data : [] });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
}

