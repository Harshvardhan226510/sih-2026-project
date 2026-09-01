import { Router } from 'express';
import { ExplainService } from '../services/explainService.js';

const router = Router();
const explainService = new ExplainService();

/**
 * POST /api/analytics/explain-trend
 * Body: { trendData: TrendAnalyticsResponse }
 */
router.post('/explain-trend', async (req, res) => {
    try {
        const { trendData } = req.body;
        if (!trendData) {
            return res.status(400).json({ error: 'trendData payload is required' });
        }
        const result = await explainService.explainTrend(trendData);
        return res.json(result);
    } catch (error) {
        console.error('Error in /api/analytics/explain-trend:', error);
        return res.status(500).json({ error: 'Failed to generate trend explanation', details: error.message });
    }
});

export default router;
