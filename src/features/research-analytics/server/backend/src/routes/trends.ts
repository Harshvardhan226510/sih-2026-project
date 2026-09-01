import { Router, Request, Response } from 'express';
import { TrendService } from '../services/trendService.js';
import { resolveLocation, validateDateRange, validateMetric } from '../utils/validation.js';

const router = Router();
const trendService = new TrendService();

/**
 * GET /api/analytics/trends
 * Query params:
 * - location: string
 * - start_date: string (YYYY-MM-DD)
 * - end_date: string (YYYY-MM-DD)
 * - metric: string (rainfall, temperature, etc.)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { location: locParam, start_date, end_date, metric: metricParam } = req.query;
    const location = resolveLocation(locParam as string);
    const { start, end } = validateDateRange(start_date as string, end_date as string);
    const metric = validateMetric(metricParam as string);

    const result = await trendService.getTrendAnalytics(location, start, end, metric);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/analytics/trends:', error);
    return res.status(500).json({ error: 'Failed to compute trend analytics', details: error.message });
  }
});

export default router;
