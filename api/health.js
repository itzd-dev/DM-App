// dapurmerifa/api/health.js
// Health check endpoint to verify env and DB connectivity

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasEnv = Boolean(url && key);
  let dbOk = false;
  let productsCount = null;

  if (hasEnv) {
    try {
      const supabase = createClient(url, key);
      const { error, count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      if (!error) {
        dbOk = true;
        productsCount = typeof count === 'number' ? count : null;
      }
    } catch (e) {
      // leave dbOk as false
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
