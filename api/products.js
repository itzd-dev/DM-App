// dapurmerifa/api/products.js
// Serverless API untuk CRUD produk via Supabase (server-side, aman untuk write)

const { createClient } = require('@supabase/supabase-js');

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

const whitelistProductFields = (row) => {
  // Only keep columns that exist in products table
  const allowed = ['name','price','category','image','description','featured','tags','allergens','rating','review_count','sold_count','is_available','current_stock','stock_history'];
  const out = {};
  for (const key of allowed) {
    if (row[key] !== undefined) out[key] = row[key];
  }
  // Coerce types
  if (out.price !== undefined) out.price = Number(out.price) || 0;
  if (out.rating !== undefined) out.rating = Number(out.rating) || 0;
  if (out.review_count !== undefined) out.review_count = Number(out.review_count) || 0;
  if (out.sold_count !== undefined) out.sold_count = Number(out.sold_count) || 0;
  if (out.current_stock !== undefined) out.current_stock = Number(out.current_stock) || 0;
  if (out.featured !== undefined) out.featured = Boolean(out.featured);
  if (out.is_available !== undefined) out.is_available = Boolean(out.is_available);
  return out;
};

module.exports = async (req, res) => {
  // CORS (atur domain di produksi)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const mapped = whitelistProductFields(camelToSnake(payload));
      const { data, error } = await supabase
        .from('products')
        .insert(mapped)
        .select('*')
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = req.body || {};
      const id = body.id || body.productId || (req.query && req.query.id);
      if (!id) return res.status(400).json({ message: 'Missing id' });

      // Operasi khusus tambah stok
      if (body.op === 'add_stock') {
        const added = Number(body.addedQuantity || body.added_quantity || 0);
        if (!Number.isFinite(added) || added <= 0) {
          return res.status(400).json({ message: 'addedQuantity must be > 0' });
        }

        // Ambil produk saat ini
        const { data: current, error: getErr } = await supabase
          .from('products')
          .select('current_stock, stock_history')
          .eq('id', id)
          .single();
        if (getErr) throw getErr;

        const today = new Date().toISOString().slice(0, 10);
        const history = Array.isArray(current.stock_history) ? current.stock_history.slice() : [];
        const existingIdx = history.findIndex((e) => e.date === today && e.type === 'addition');
        if (existingIdx !== -1) history[existingIdx].quantity += added;
        else history.push({ date: today, quantity: added, type: 'addition' });

        const nextStock = Number(current.current_stock || 0) + added;
        const { data, error } = await supabase
          .from('products')
          .update({ current_stock: nextStock, stock_history: history })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      // Update umum (mis. toggle availability, edit fields)
      const mapped = whitelistProductFields(camelToSnake(body));
      delete mapped.id;
      delete mapped.product_id;
      delete mapped.op;
      const { data, error } = await supabase
        .from('products')
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
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Unexpected error' });
  }
};
