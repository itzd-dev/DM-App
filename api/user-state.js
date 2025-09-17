// dapurmerifa/api/user-state.js
// Persist per-user cart, wishlist, and profile preferences in Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const requireUser = async (req, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ message: 'Unauthorized' });
    return data.user;
  } catch (error) {
    console.error('[user-state] requireUser error', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

const normaliseState = (row) => ({
  cart: Array.isArray(row?.cart) ? row.cart : [],
  wishlist: Array.isArray(row?.wishlist) ? row.wishlist : [],
  profiles: typeof row?.profiles === 'object' && row?.profiles !== null ? row.profiles : {},
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireUser(req, res);
  if (!user?.id) return;
  const userId = user.id;
  const email = user.email;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('user_state')
        .select('cart,wishlist,profiles')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await supabase
            .from('user_state')
            .insert({ id: userId, email, cart: [], wishlist: [], profiles: {} })
            .select('cart,wishlist,profiles')
            .single();
          return res.status(200).json({ cart: [], wishlist: [], profiles: {} });
        }
        throw error;
      }

      return res.status(200).json(normaliseState(data));
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const payload = req.body || {};
      const updates = { id: userId, email };
      if (payload.cart !== undefined) updates.cart = payload.cart;
      if (payload.wishlist !== undefined) updates.wishlist = payload.wishlist;
      if (payload.profiles !== undefined) updates.profiles = payload.profiles;

      const { data, error } = await supabase
        .from('user_state')
        .upsert({ ...updates, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select('cart,wishlist,profiles')
        .single();
      if (error) throw error;
      return res.status(200).json(normaliseState(data));
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[user-state] handler error', error);
    return res.status(500).json({ message: error.message || 'Unexpected error' });
  }
}
