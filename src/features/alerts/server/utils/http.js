import logger from './logger.js';
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const BACKOFF_BASE = 1000;
export async function fetchWithRetry(url, opts = {}) {
  const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES, ...fetchOpts } = opts;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...fetchOpts, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok && attempt < retries && res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      const delay = BACKOFF_BASE * Math.pow(2, attempt) + Math.random() * 500;
      logger.warn({ url, attempt, err: err.message }, 'request failed, retrying');
      await new Promise(r => setTimeout(r, delay));
    }
  }
}