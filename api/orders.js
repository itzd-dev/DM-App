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
      const mapped = camelToSnake(body);
      delete mapped.id;
      const { data, error } = await supabase
        .from('orders')
        .update(mapped)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
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
