// dapurmerifa/api/orders.js
// Serverless API untuk CRUD order via Supabase (server-side)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const camelToSnake = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
};

export default async function handler(req, res) {
  // CORS (batasi domain di produksi)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      // Body dapat berisi: id (string seperti DM-xxxx), customer, customerEmail, items (json), total, status, discount (json), date (YYYY-MM-DD)
      const mapped = camelToSnake(body);
      const { data, error } = await supabase
        .from('orders')
        .insert(mapped)
        .select('*')
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = req.body || {};
      const id = body.id || (req.query && req.query.id);
      if (!id) return res.status(400).json({ message: 'Missing id' });

      // Fetch current order to detect status transition
      const { data: beforeRow, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;
      const prevStatus = beforeRow?.status || null;

      const mapped = camelToSnake(body);
      delete mapped.id;
      const { data: afterRow, error } = await supabase
        .from('orders')
        .update(mapped)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;

      // Simple rule: if status transitions to 'Dibatalkan', refund redeemed points automatically
      try {
        const newStatus = afterRow?.status;
        if (prevStatus !== 'Dibatalkan' && newStatus === 'Dibatalkan') {
          // Determine redeemed points from order row
          const ptsDiscount = Number(afterRow?.points_discount || beforeRow?.points_discount || 0);
          let ptsRedeemed = Number(afterRow?.points_redeemed || beforeRow?.points_redeemed || 0);
          if (!ptsRedeemed && ptsDiscount > 0) ptsRedeemed = Math.floor(ptsDiscount / 100);

          const email = afterRow?.customer_email || beforeRow?.customer_email;
          if (email && ptsRedeemed > 0) {
            // Resolve user id via user_profiles, fallback to existing loyalty_points by email
            let userId = null;
            try {
              const { data: prof, error: eProf } = await supabase
                .from('user_profiles')
                .select('id,email')
                .eq('email', email)
                .single();
              if (!eProf && prof?.id) userId = prof.id;
            } catch (_) {}

            if (!userId) {
              try {
                const { data: lpByEmail, error: eLp } = await supabase
                  .from('loyalty_points')
                  .select('id,email,points')
                  .eq('email', email)
                  .limit(1)
                  .single();
                if (!eLp && lpByEmail?.id) userId = lpByEmail.id;
              } catch (_) {}
            }

            if (userId) {
              // Ensure points row exists
              const { data: current, error: e1 } = await supabase
                .from('loyalty_points')
                .select('points,email')
                .eq('id', userId)
                .single();
              let currentPts = 0;
              if (e1 && e1.code !== 'PGRST116') throw e1;
              if (current && typeof current.points === 'number') currentPts = current.points;
              if (!current) {
                const { error: insErr } = await supabase
                  .from('loyalty_points')
                  .insert({ id: userId, email, points: 0 });
                if (insErr) throw insErr;
              }

              // Idempotency guard: skip if a similar refund already recorded after order creation
              const orderCreatedAt = afterRow?.created_at || beforeRow?.created_at || null;
              if (orderCreatedAt) {
                try {
                  const { data: dup } = await supabase
                    .from('loyalty_history')
                    .select('op,amount,created_at')
                    .eq('user_id', userId)
                    .eq('op', 'refund')
                    .eq('amount', ptsRedeemed)
                    .gte('created_at', orderCreatedAt)
                    .limit(1);
                  if (Array.isArray(dup) && dup.length > 0) {
                    return res.status(200).json(afterRow);
                  }
                } catch (_) {}
              }

              const nextPts = currentPts + ptsRedeemed;
              const { data: updatedPts, error: upErr } = await supabase
                .from('loyalty_points')
                .upsert({ id: userId, email, points: nextPts })
                .select('points')
                .single();
              if (upErr) throw upErr;

              // Write history as refund
              await supabase.from('loyalty_history').insert({
                user_id: userId,
                email,
                op: 'refund',
                amount: ptsRedeemed,
                points_before: currentPts,
                points_after: nextPts,
              });
            }
          }
        }
      } catch (e) {
        // Do not fail order update if refund fails; log via console
        console.error('refund failed', e);
      }

      return res.status(200).json(afterRow);
    }

    if (req.method === 'DELETE') {
      const id = (req.query && (req.query.id || (Array.isArray(req.query.id) ? req.query.id[0] : undefined))) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ message: 'Missing id' });
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
}
