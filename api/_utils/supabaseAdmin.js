import { createClient } from '@supabase/supabase-js';

let cachedClient;

export const getSupabaseAdmin = () => {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }
  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'dapurmerifa-api',
      },
    },
  });
  return cachedClient;
};
