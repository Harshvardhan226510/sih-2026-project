import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import alertRoutes from './routes/alerts.js';
import logger from './utils/logger.js';
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path !== '/api/health') {
      logger.info({ method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start });
    }
  });
  next();
});
app.use('/api', alertRoutes);
app.use((err, req, res, _next) => {
  logger.error({ err: err.message, path: req.path }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});
export default app;