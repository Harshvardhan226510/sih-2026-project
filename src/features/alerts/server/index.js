import app from './app.js';
import config from './config/index.js';
import { initDb } from './db/connection.js';
import { startScheduler, stopScheduler } from './jobs/scheduler.js';
import logger from './utils/logger.js';

async function start() {
  await initDb();
  startScheduler();
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'server started');
  });

  // Graceful shutdown — ensures MQTT is disconnected cleanly
  function shutdown(signal) {
    logger.info({ signal }, 'shutdown signal received');
    stopScheduler();
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10s if server doesn't close
    setTimeout(() => { process.exit(1); }, 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch(err => {
  logger.error({ err: err.message }, 'failed to start server');
  process.exit(1);
});