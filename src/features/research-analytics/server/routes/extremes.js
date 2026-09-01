import { Router } from 'express';
import { ExtremeEventService } from '../services/extremeService.js';
import { resolveLocation, validateDateRange, validateMetric } from '../utils/validation.js';

const router = Router();
const extremeService = new ExtremeEventService();

/**
 * GET /api/analytics/extremes
 * Query params:
 * - location: string or JSON
 * - start_date, end_date: YYYY-MM-DD
 * - metric: 'all' | 'rainfall' | 'temperature' | 'wind_speed' | 'pressure'
 * - threshold: number
 * - top_n: number
 * - direction: 'highest' | 'lowest'
 * - mode: 'explorer' | 'recurrence'
 */
router.get('/', async (req, res) => {
    try {
        const { 
            location: locParam, 
            start_date, 
            end_date, 
            metric: metricParam, 
            threshold, 
            top_n, 
            direction,
            mode 
        } = req.query;

        const location = resolveLocation(locParam || 'pune');
        const { start, end } = validateDateRange(start_date, end_date);
        const metric = metricParam && metricParam !== 'all' ? validateMetric(metricParam) : 'all';

        if (mode === 'recurrence') {
            const threshVal = threshold ? parseFloat(threshold) : (metric === 'rainfall' ? 64.5 : 40.0);
            const result = await extremeService.calculateEventRecurrence(location, start, end, metric === 'all' ? 'rainfall' : metric, threshVal);
            return res.json(result);
        }

        const options = {
            metric,
            threshold: threshold ? parseFloat(threshold) : undefined,
            topN: top_n ? parseInt(top_n, 10) : undefined,
            direction: direction === 'lowest' ? 'lowest' : 'highest'
        };

        const result = await extremeService.detectExtremeEvents(location, start, end, options);
        return res.json(result);
    } catch (error) {
        console.error('Error in /api/analytics/extremes:', error);
        return res.status(500).json({ error: 'Failed to detect extreme events', details: error.message });
    }
});

export default router;
