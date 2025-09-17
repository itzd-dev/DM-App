// dapurmerifa/api/promotions.js
// Serverless API untuk kode promo via Supabase

import { getSupabaseAdmin } from './_utils/supabaseAdmin.js';
import { requireAdmin } from './_utils/auth.js';
import { applyCors } from './_utils/cors.js';

const supabase = getSupabaseAdmin();

export default async function handler(req, res) {
  if (!applyCors(req, res, { allowMethods: 'GET,POST,DELETE,OPTIONS' })) return;
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('code', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const user = await requireAdmin(req, res); if (!user) return;
      const body = req.body || {};
      // body: { code, discount, type }
      const { data, error } = await supabase
        .from('promotions')
        .insert({ code: body.code, discount: body.discount, type: body.type })
        .select('*')
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await requireAdmin(req, res); if (!user) return;
      const code = (req.query && (req.query.code || (Array.isArray(req.query.code) ? req.query.code[0] : undefined))) || (req.body && req.body.code);
      if (!code) return res.status(400).json({ message: 'Missing code' });
      const { error } = await supabase.from('promotions').delete().eq('code', code);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
}
