import { Router } from 'express';

import historicalRoutes from './historical.js';
import trendsRoutes from './trends.js';
import anomalyRoutes from './anomaly.js';
import comparisonRoutes from './comparison.js';
import extremesRoutes from './extremes.js';
import climateProfileRoutes from './climateProfile.js';
import forecastAccuracyRoutes from './forecastAccuracy.js';
import eventReplayRoutes from './eventReplay.js';
import researchQueryRoutes from './researchQuery.js';
import metadataRoutes from './metadata.js';
import explainRoutes from './explain.js';
import recentQueriesRoutes from './recentQueries.js';

const router = Router();

router.use('/historical', historicalRoutes);
router.use('/trends', trendsRoutes);
router.use('/anomaly', anomalyRoutes);
router.use('/compare', comparisonRoutes);
router.use('/extremes', extremesRoutes);
router.use('/climate-profile', climateProfileRoutes);
router.use('/forecast-accuracy', forecastAccuracyRoutes);
router.use('/event-replay', eventReplayRoutes);
router.use('/query', researchQueryRoutes);
router.use('/metadata', metadataRoutes);
router.use('/explain', explainRoutes);
router.use('/recent-queries', recentQueriesRoutes);

export default router;
