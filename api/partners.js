// dapurmerifa/api/partners.js
// Serverless API untuk daftar mitra (partners)

import { getSupabaseAdmin } from './_utils/supabaseAdmin.js';
import { requireAdmin } from './_utils/auth.js';
import { applyCors } from './_utils/cors.js';

const supabase = getSupabaseAdmin();

export default async function handler(req, res) {
  if (!applyCors(req, res, { allowMethods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' })) return;
  if (req.method === 'OPTIONS') return res.status(204).end();

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
