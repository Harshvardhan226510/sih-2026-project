import { WeatherProvider } from './base.js';
import { fetchWithRetry } from '../utils/http.js';
import { parseRSS, parseCAP } from '../utils/xml.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
export class IMDAlertProvider extends WeatherProvider {
  get name() { return 'imd'; }
  get type() { return 'alert'; }
  async fetchAlerts() {
    logger.info('fetching IMD RSS feed');
    const rssRes = await fetchWithRetry(config.imd.rssUrl, { timeout: 20000 });
    const rssXml = await rssRes.text();
    const items = parseRSS(rssXml);
    if (!items.length) {
      logger.warn('IMD RSS feed returned no items');
      return [];
    }
    logger.info({ count: items.length }, 'fetching individual CAP alerts');
    const alerts = [];
    for (const item of items) {
      try {
        const capRes = await fetchWithRetry(item.link, { timeout: 15000, retries: 2 });
        const capXml = await capRes.text();
        const parsed = parseCAP(capXml);
        if (parsed) {
          // Strictly identify IMD alerts among multi-agency SACHET feed
          const sender = (parsed.sender || '').toUpperCase();
          const author = (item.author || '').toUpperCase();
          
          if (sender.includes('IMD') || author.includes('IMD')) {
            parsed._rssItem = item;
            alerts.push(parsed);
          }
        }
      } catch (err) {
        logger.warn({ link: item.link, err: err.message }, 'failed to fetch CAP alert');
      }
    }
    logger.info({ fetched: alerts.length, total: items.length }, 'IMD alerts fetched');
    return alerts;
  }
}