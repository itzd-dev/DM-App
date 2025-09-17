const parseOrigins = () => {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const applyCors = (req, res, { allowMethods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS', allowHeaders = 'Content-Type, Authorization' } = {}) => {
  const allowList = parseOrigins();
  const origin = req.headers.origin;
  const allowAny = allowList.length === 0 || allowList.includes('*');
  let allowedOrigin = '*';

  if (allowAny) {
    allowedOrigin = allowList.includes('*') ? '*' : origin || '*';
  } else if (!origin) {
    allowedOrigin = allowList[0];
  } else if (allowList.includes(origin)) {
    allowedOrigin = origin;
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
    } else {
      res.status(403).json({ message: 'Origin not allowed' });
    }
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  if (allowedOrigin !== '*') {
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', allowMethods);
  res.setHeader('Access-Control-Allow-Headers', allowHeaders);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return true;
};
