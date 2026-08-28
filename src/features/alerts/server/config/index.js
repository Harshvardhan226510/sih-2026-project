import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../../../..');
loadEnv({ path: resolve(root, '.env') });
const config = {
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
  mqtt: {
    enabled: process.env.MQTT_ENABLED === 'true',
    brokerUrl: process.env.MQTT_BROKER_URL || '',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    clientId: process.env.MQTT_CLIENT_ID || `weathergpt-${Math.random().toString(16).slice(2, 10)}`,
    topic: process.env.MQTT_TOPIC || 'weathergpt/alerts/#',
    keepalive: parseInt(process.env.MQTT_KEEPALIVE || '60', 10),
    reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || '5000', 10),
  },
  adminSecret: process.env.ADMIN_SECRET || null,
  vapid: {
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@weathergpt.local',
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
};

if (!config.vapid.privateKey && config.env === 'production') {
  console.warn('[Security] VAPID_PRIVATE_KEY is missing in production!');
}

export default config;