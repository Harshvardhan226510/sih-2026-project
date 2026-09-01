import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Middleware to protect administrative endpoints using a bearer token.
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!config.adminSecret) {
    logger.warn('requireAdmin called but ADMIN_SECRET is not configured');
    return res.status(503).json({ error: 'Server misconfigured' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== config.adminSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}

/**
 * Validates the basic shape of coordinates.
 */
function isValidCoordinate(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  return true;
}

/**
 * Middleware to validate location updates.
 */
export function validateLocationPayload(req, res, next) {
  const { deviceId, latitude, longitude, accuracy } = req.body;
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 255) {
    return res.status(400).json({ error: 'Valid deviceId required' });
  }
  if (!isValidCoordinate(latitude, longitude)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  next();
}

/**
 * Middleware to validate push subscription registration.
 */
export function validateSubscriptionPayload(req, res, next) {
  const { deviceId, subscription } = req.body;
  
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 255) {
    return res.status(400).json({ error: 'Valid deviceId required' });
  }
  
  if (!subscription || typeof subscription !== 'object') {
    return res.status(400).json({ error: 'Subscription object required' });
  }
  
  if (!subscription.endpoint || typeof subscription.endpoint !== 'string' || !subscription.endpoint.startsWith('https://')) {
    return res.status(400).json({ error: 'Valid subscription endpoint required' });
  }
  
  if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ error: 'Subscription keys required' });
  }

  next();
}

/**
 * Middleware to validate revision synchronization requests.
 */
export function validateSyncPayload(req, res, next) {
  const since = Number(req.query.since);
  if (req.query.since === undefined || isNaN(since) || since < 0 || since > Number.MAX_SAFE_INTEGER || !Number.isInteger(since)) {
    return res.status(400).json({ error: 'Valid integer since parameter required' });
  }
  next();
}
