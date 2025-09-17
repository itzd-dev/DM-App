// dapurmerifa/api/partners.js
// Serverless API untuk daftar mitra (partners)

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
  // CORS (batasi origin di produksi)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const user = await requireAdmin(req, res); if (!user) return;
      const body = req.body || {};
      const { data, error } = await supabase
        .from('partners')
        .insert({ name: body.name, contact: body.contact, notes: body.notes })
        .select('*')
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const user = await requireAdmin(req, res); if (!user) return;
      const body = req.body || {};
      const id = body.id || (req.query && req.query.id);
      if (!id) return res.status(400).json({ message: 'Missing id' });
      const { data, error } = await supabase
        .from('partners')
        .update({ name: body.name, contact: body.contact, notes: body.notes })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await requireAdmin(req, res); if (!user) return;
      const id = (req.query && (req.query.id || (Array.isArray(req.query.id) ? req.query.id[0] : undefined))) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ message: 'Missing id' });
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
}
