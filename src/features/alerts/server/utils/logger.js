import pino from 'pino';
import config from '../config/index.js';
const logger = pino({
  level: config.logLevel || 'info',
  redact: {
    paths: [
      'MQTT_PASSWORD', 
      'VAPID_PRIVATE_KEY', 
      'password', 
      'token',
      'ADMIN_SECRET'
    ],
    censor: '[REDACTED]'
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    },
  },
});
export default logger;