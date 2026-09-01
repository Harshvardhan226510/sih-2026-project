import { Router } from 'express';
import { ResearchRecentQueriesRepository } from '../repositories/researchRecentQueriesRepository.js';

const router = Router();
const repo = new ResearchRecentQueriesRepository();

/**
 * GET /api/analytics/recent-queries
 */
router.get('/', (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
        const queries = repo.getRecentQueries(limit);
        return res.json({ queries });
    } catch (error) {
        console.error('Error in GET /api/analytics/recent-queries:', error);
        return res.status(500).json({ error: 'Failed to fetch recent queries', details: error.message });
    }
});

/**
 * POST /api/analytics/recent-queries
 * Body: { queryType, title, location, params }
 */
router.post('/', (req, res) => {
    try {
        const { queryType, title, location, params } = req.body;
        if (!queryType || !title || !location) {
            return res.status(400).json({ error: 'queryType, title, and location are required' });
        }
        const saved = repo.saveQuery({ queryType, title, location, params });
        return res.json({ success: true, entry: saved });
    } catch (error) {
        console.error('Error in POST /api/analytics/recent-queries:', error);
        return res.status(500).json({ error: 'Failed to save recent query', details: error.message });
    }
});

export default router;
