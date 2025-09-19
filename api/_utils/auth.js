import { getSupabaseAdmin } from './supabaseAdmin.js';

const supabase = getSupabaseAdmin();

const extractBearerToken = (req) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies && req.cookies.sb_access_token) {
    return req.cookies.sb_access_token;
  }
  return null;
};

export const getUserFromRequest = async (req) => {
  const token = extractBearerToken(req);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
};

export const requireUser = async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return null;
    }
    return user;
  } catch (error) {
    console.error('[auth] requireUser error', error);
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
};

export const requireAdmin = async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!user.app_metadata?.roles?.includes('admin')) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  return user;
};
