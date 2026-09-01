import { WeatherProvider } from './base.js';
import { fetchWithRetry } from '../utils/http.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
export class OpenMeteoProvider extends WeatherProvider {
  get name() { return 'open-meteo'; }
  get type() { return 'forecast'; }
  async fetchForecast(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
      timezone: 'Asia/Kolkata',
    });
    const url = `${config.openMeteo.baseUrl}/forecast?${params}`;
    const res = await fetchWithRetry(url, { timeout: 10000, retries: 2 });
    return res.json();
  }
  async fetchAlerts() {
    return [];
  }
  async fetchContextForAlerts(alerts) {
    const results = [];
    for (const alert of alerts) {
      if (!alert.latitude || !alert.longitude) continue;
      try {
        const forecast = await this.fetchForecast(alert.latitude, alert.longitude);
        results.push({ alertId: alert.id, forecast: forecast.current });
      } catch (err) {
        logger.warn({ alertId: alert.id, err: err.message }, 'open-meteo forecast failed');
      }
    }
    return results;
  }
}