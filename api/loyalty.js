// dapurmerifa/api/loyalty.js
// API loyalitas poin: baca/tambah/tukar poin per pengguna (berdasarkan token Supabase)

import { getSupabaseAdmin } from './_utils/supabaseAdmin.js';
import { requireUser, requireAdmin } from './_utils/auth.js';
import { applyCors } from './_utils/cors.js';

const supabase = getSupabaseAdmin();

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client is not initialized. Check server environment variables.' });
  }
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

    // Ensure row exists for a given user ID and email
    const ensureRow = async (userId, userEmail) => {
      const { data: row, error } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('id', userId)
        .single();
      if (row) return row;
      if (error && error.code !== 'PGRST116') throw error; // Ignore 'no rows found'
      const { data: created, error: e2 } = await supabase
        .from('loyalty_points')
        .insert({ id: userId, email: userEmail, points: 0 })
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.status(200).json({ history: data || [] });
      }
      const row = await ensureRow(user.id, user.email);
      return res.status(200).json({ points: row?.points ?? 0 });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const op = (body.op || '').toString();
      const amount = Number(body.amount || 0);
      if (!['earn', 'redeem'].includes(op)) return res.status(400).json({ message: 'Invalid op' });
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'amount must be > 0' });

      let targetUserId = user.id;
      let targetUserEmail = user.email;

      const isAdmin = user.app_metadata?.roles?.includes('admin');

      // If admin and email is provided, target that user instead
      if (isAdmin && body.email && body.email !== user.email) {
        const { data: { users: targetUsers }, error: findErr } = await supabase.auth.admin.listUsers({ email: body.email });
        if (findErr || !targetUsers || targetUsers.length === 0) {
          return res.status(404).json({ message: 'Target user not found.' });
        }
        targetUserId = targetUsers[0].id;
        targetUserEmail = targetUsers[0].email;
      }

      await ensureRow(targetUserId, targetUserEmail);

      const { data: current, error: err } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('id', targetUserId)
        .single();
      
      if (err && err.code !== 'PGRST116') {
        // PGRST116 means no row was found, which is fine, we start from 0.
        // For other errors, we should throw.
        throw err;
      }
      const currentPts = current?.points ?? 0;

      let next = currentPts;
      if (op === 'earn') next = currentPts + amount;
      if (op === 'redeem') {
        if (currentPts < amount) return res.status(400).json({ message: 'Poin tidak cukup' });
        next = currentPts - amount;
      }

      const { data: updated, error: e2 } = await supabase
        .from('loyalty_points')
        .update({ points: next, email: targetUserEmail })
        .eq('id', targetUserId)
        .select('points')
        .single();

      if (e2) throw e2;

      // Write history log
      await supabase.from('loyalty_history').insert({
        user_id: targetUserId,
        email: targetUserEmail,
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
