import { Router, Request, Response } from 'express';
import { HistoricalService } from '../services/historicalService.js';
import { 
  resolveLocation, 
  validateDateRange, 
  validateMetric, 
  validateAggregation 
} from '../utils/validation.js';

const router = Router();
const historicalService = new HistoricalService();

/**
 * GET /api/analytics/historical
 * Query params:
 * - location: string (city name or "lat,lon")
 * - start_date: string (YYYY-MM-DD)
 * - end_date: string (YYYY-MM-DD)
 * - metric: string (rainfall, temperature, etc.)
 * - aggregation: string (daily, weekly, monthly, yearly)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { location: locParam, start_date, end_date, metric: metricParam, aggregation: aggParam } = req.query;

    const location = resolveLocation(locParam as string);
    const { start, end } = validateDateRange(start_date as string, end_date as string);
    const metric = validateMetric(metricParam as string);
    const aggregation = validateAggregation(aggParam as string);

    const analyticsResult = await historicalService.getHistoricalAnalytics(
      location,
      start,
      end,
      metric,
      aggregation
    );

    return res.json(analyticsResult);
  } catch (error: any) {
    console.error('Error in /api/analytics/historical:', error);
    return res.status(500).json({
      error: 'Failed to compute historical analytics',
      details: error.message
    });
  }
});

export default router;
