// dapurmerifa/api/promotions.js
// Serverless API untuk kode promo via Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const requireAdmin = async (req, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ message: 'Unauthorized' });
    const { data: prof } = await supabase.from('user_profiles').select('role').eq('id', data.user.id).single();
    if (prof?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return data.user;
  } catch (_e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default async function handler(req, res) {
  // CORS (batasi domain di produksi)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

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
