// dapurmerifa/api/user-state.js
// Persist per-user cart, wishlist, and profile preferences in Supabase

import { getSupabaseAdmin } from './_utils/supabaseAdmin.js';
import { requireUser } from './_utils/auth.js';
import { applyCors } from './_utils/cors.js';

const supabase = getSupabaseAdmin();

const normaliseState = (row) => ({
  cart: Array.isArray(row?.cart) ? row.cart : [],
  wishlist: Array.isArray(row?.wishlist) ? row.wishlist : [],
  profiles: typeof row?.profiles === 'object' && row?.profiles !== null ? row.profiles : {},
});

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client is not initialized. Check server environment variables.' });
  }
  if (!applyCors(req, res, { allowMethods: 'GET,PUT,PATCH,OPTIONS' })) return;
  if (req.method === 'OPTIONS') return res.status(204).end();

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