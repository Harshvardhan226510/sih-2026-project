import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import alertRoutes from './routes/alerts.js';
import analyticsRoutes from '../../research-analytics/server/routes/index.js';
import logger from './utils/logger.js';
import config from './config/index.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  }
}));

app.use(cors());
app.use(compression());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Max 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

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
app.use('/api/analytics', analyticsRoutes);


app.use((err, req, res, _next) => {
  logger.error({ err: err.message, path: req.path }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error' }); // Safe error message
});
export default app;