// dapurmerifa/api/loyalty.js
// API loyalitas poin: baca/tambah/tukar poin per pengguna (berdasarkan token Supabase)

import { getSupabaseAdmin } from './_utils/supabaseAdmin.js';
import { requireUser, requireAdmin } from './_utils/auth.js';
import { applyCors } from './_utils/cors.js';

const supabase = getSupabaseAdmin();

export default async function handler(req, res) {
  if (!applyCors(req, res, { allowMethods: 'GET,POST,OPTIONS' })) return;
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Admin route to fetch all points
    if (req.method === 'GET' && req.query.all === 'true') {
      const adminUser = await requireAdmin(req, res);
      if (!adminUser) return; // response already sent

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('email, points');
      
      if (error) throw error;
      
      // Transform the data into a map of { [email]: points }
      const pointsMap = (data || []).reduce((acc, record) => {
        if (record.email) {
          acc[record.email] = record.points;
        }
        return acc;
      }, {});

      return res.status(200).json(pointsMap);
    }

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
      if (String(req.query?.history || '') === '1') {
        const { data, error } = await supabase
          .from('loyalty_history')
          .select('op,amount,points_before,points_after,created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.status(200).json({ history: data || [] });
      }
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
      // Write history log
      await supabase.from('loyalty_history').insert({
        user_id: uid,
        email,
        op,
        amount,
        points_before: currentPts,
        points_after: next,
      });
      return res.status(200).json({ points: updated.points });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
}
