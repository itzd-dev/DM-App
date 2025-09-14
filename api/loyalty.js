// dapurmerifa/api/loyalty.js
// API loyalitas poin: baca/tambah/tukar poin per pengguna (berdasarkan token Supabase)

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = await requireUser(req, res);
    if (!user?.id) return; // response already sent
    const uid = user.id;
    const email = user.email;

    // Ensure row exists
    const ensureRow = async () => {
      const { data: row, error } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('id', uid)
        .single();
      if (row) return row;
      if (error && error.code !== 'PGRST116') throw error;
      const { data: created, error: e2 } = await supabase
        .from('loyalty_points')
        .insert({ id: uid, email, points: 0 })
        .select('points')
        .single();
      if (e2) throw e2;
      return created;
    };

    if (req.method === 'GET') {
      const row = await ensureRow();
      return res.status(200).json({ points: row?.points ?? 0 });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const op = (body.op || '').toString();
      const amount = Number(body.amount || 0);
      if (!['earn', 'redeem'].includes(op)) return res.status(400).json({ message: 'Invalid op' });
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'amount must be > 0' });

      const { data: current, error: err } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('id', uid)
        .single();
      if (err && err.code !== 'PGRST116') throw err;
      const currentPts = current?.points ?? 0;

      let next = currentPts;
      if (op === 'earn') next = currentPts + amount;
      if (op === 'redeem') {
        if (currentPts < amount) return res.status(400).json({ message: 'Poin tidak cukup' });
        next = currentPts - amount;
      }

      const { data: updated, error: e2 } = await supabase
        .from('loyalty_points')
        .upsert({ id: uid, email, points: next })
        .select('points')
        .single();
      if (e2) throw e2;
      return res.status(200).json({ points: updated.points });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
}

