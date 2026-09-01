import { supabase } from './supabase.js';
import { config } from './config.js';

export async function requireUser(req, res, next) {
  if (config.demoMode) return next();
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const { data, error } = await supabase().auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid session.' });
    req.user = data.user;
    next();
  } catch (error) { next(error); }
}

export function errors(error, _req, res, _next) {
  console.error(error);
  if (error.message?.startsWith('Server configuration missing:')) return res.status(503).json({ error: error.message });
  return res.status(500).json({ error: 'Unexpected server error.' });
}
