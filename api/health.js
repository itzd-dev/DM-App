// dapurmerifa/api/health.js
// Health check endpoint to verify env and DB connectivity

import { getSupabaseAdmin } from './_utils/supabaseAdmin.js';
import { applyCors } from './_utils/cors.js';

export default async function handler(req, res) {
  if (!applyCors(req, res, { allowMethods: 'GET,OPTIONS' })) return;
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasEnv = Boolean(url && key);
  let dbOk = false;
  let productsCount = null;

  if (hasEnv) {
    try {
      const supabase = getSupabaseAdmin();
      const { error, count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      if (!error) {
        dbOk = true;
        productsCount = typeof count === 'number' ? count : null;
      }
    } catch (error) {
      console.error('[health] database check failed', error);
    }
  }

  res.status(200).json({
    env: {
      SUPABASE_URL: Boolean(url),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(key),
    },
    db: {
      connected: dbOk,
      productsCount,
    },
    nodeVersion: process.version,
  });
}
