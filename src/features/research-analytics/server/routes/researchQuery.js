import { Router } from 'express';
import { ResearchQueryService } from '../services/researchQueryService.js';
const router = Router();
const researchQueryService = new ResearchQueryService();
/**
 * POST /api/analytics/query
 * Body: { query: string, preferredLocation?: string }
 */
router.post('/', async (req, res) => {
    try {
        const { query, preferredLocation } = req.body;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query string is required' });
        }
        const result = await researchQueryService.processResearchQuery({
            query,
            preferredLocation
        });
        return res.json(result);
    }
    catch (error) {
        console.error('Error in /api/analytics/query:', error);
        return res.status(500).json({ error: 'Failed to process natural language research query', details: error.message });
    }
});
export default router;
