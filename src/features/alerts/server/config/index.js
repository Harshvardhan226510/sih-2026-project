import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../../../..');
loadEnv({ path: resolve(root, '.env') });
export default {
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  db: {
    path: resolve(root, process.env.DB_PATH || './src/features/alerts/server/db/weathergpt.db'),
  },
  imd: {
    rssUrl: process.env.IMD_RSS_URL || 'https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml',
  },
  openMeteo: {
    baseUrl: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1',
  },
  ingestion: {
    cron: process.env.INGESTION_CRON || '*/10 * * * *',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  // MQTT — real-time backend event propagation (optional; server-side only)
  // Set MQTT_ENABLED=true and provide broker credentials to activate.
  // System operates normally without MQTT via existing IMD RSS/CAP ingestion.
  mqtt: {
    enabled: process.env.MQTT_ENABLED === 'true',
    brokerUrl: process.env.MQTT_BROKER_URL || '',
    username: process.env.MQTT_USERNAME || '',
    // password is used internally only; never logged or exposed
    password: process.env.MQTT_PASSWORD || '',
    clientId: process.env.MQTT_CLIENT_ID || `weathergpt-${Math.random().toString(16).slice(2, 10)}`,
    topic: process.env.MQTT_TOPIC || 'weathergpt/alerts/#',
    keepalive: parseInt(process.env.MQTT_KEEPALIVE || '60', 10),
    reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || '5000', 10),
  },
  // VAPID — Web Push authentication (required for push notifications)
  // Generate keys once: node scripts/generate-vapid.js
  // VAPID_PRIVATE_KEY must NEVER be sent to the browser.
  vapid: {
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@weathergpt.local',
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
};