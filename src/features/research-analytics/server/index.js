import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import historicalRoutes from './routes/historical.js';
import trendsRoutes from './routes/trends.js';
import anomalyRoutes from './routes/anomaly.js';
import comparisonRoutes from './routes/comparison.js';
import extremesRoutes from './routes/extremes.js';
import climateProfileRoutes from './routes/climateProfile.js';
import forecastAccuracyRoutes from './routes/forecastAccuracy.js';
import eventReplayRoutes from './routes/eventReplay.js';
import researchQueryRoutes from './routes/researchQuery.js';
import metadataRoutes from './routes/metadata.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
// Analytics REST API routes
app.use('/api/analytics/historical', historicalRoutes);
app.use('/api/analytics/trends', trendsRoutes);
app.use('/api/analytics/anomaly', anomalyRoutes);
app.use('/api/analytics/compare', comparisonRoutes);
app.use('/api/analytics/extremes', extremesRoutes);
app.use('/api/analytics/climate-profile', climateProfileRoutes);
app.use('/api/analytics/forecast-accuracy', forecastAccuracyRoutes);
app.use('/api/analytics/event-replay', eventReplayRoutes);
app.use('/api/analytics/query', researchQueryRoutes);
app.use('/api/analytics/metadata', metadataRoutes);
// Comprehensive Health & Upstream Data Sources Diagnostic Check
app.get('/api/health', async (_req, res) => {
    const startTime = Date.now();
    // Probe Open-Meteo ERA5 Historical Archive API
    let era5Status = {
        provider: 'Copernicus Climate Change Service (C3S) / ECMWF',
        dataset: 'ERA5 & ERA5-Land Reanalysis (0.1° High-Resolution Grid)',
        endpoint: 'https://archive-api.open-meteo.com/v1/archive',
        status: 'UNKNOWN',
        latencyMs: 0,
        coverage: '1940 - Present'
    };
    try {
        const era5Start = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const era5Res = await fetch('https://archive-api.open-meteo.com/v1/archive?latitude=18.52&longitude=73.85&start_date=2023-01-01&end_date=2023-01-02&daily=precipitation_sum', {
            signal: controller.signal
        });
        clearTimeout(timer);
        era5Status.latencyMs = Date.now() - era5Start;
        era5Status.status = era5Res.ok ? 'ONLINE' : `HTTP_${era5Res.status}`;
    }
    catch (err) {
        era5Status.status = err.name === 'AbortError' ? 'TIMEOUT (>3.5s)' : 'UNREACHABLE';
    }
    // Probe Operational NWP Forecast API (GFS/ECMWF IFS)
    let nwpStatus = {
        provider: 'NOAA GFS & ECMWF IFS Operational Numerical Weather Prediction',
        dataset: 'Open-Meteo Seamless Forecasting (0.25° Resolution)',
        endpoint: 'https://api.open-meteo.com/v1/forecast',
        status: 'UNKNOWN',
        latencyMs: 0,
        leadTime: 'D+0 to D+16'
    };
    try {
        const nwpStart = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const nwpRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.85&forecast_days=1&daily=temperature_2m_mean', {
            signal: controller.signal
        });
        clearTimeout(timer);
        nwpStatus.latencyMs = Date.now() - nwpStart;
        nwpStatus.status = nwpRes.ok ? 'ONLINE' : `HTTP_${nwpRes.status}`;
    }
    catch (err) {
        nwpStatus.status = err.name === 'AbortError' ? 'TIMEOUT (>3.5s)' : 'UNREACHABLE';
    }
    const isHealthy = era5Status.status === 'ONLINE' || nwpStatus.status === 'ONLINE';
    res.json({
        status: isHealthy ? 'healthy' : 'degraded',
        module: 'WeatherGPT Research & Analytics Engine',
        timestamp: new Date().toISOString(),
        totalDiagnosticTimeMs: Date.now() - startTime,
        dataSources: {
            openMeteoHistoricalERA5: era5Status,
            openMeteoOperationalNWP: nwpStatus,
            imdClimatologicalNormals: {
                provider: 'India Meteorological Department (IMD)',
                dataset: '30-Year Reference Baseline & Extreme Weather Criteria',
                status: 'ONLINE (In-Memory Calibrated Fallback)',
                coverage: 'All Indian Agro-Climatic Zones'
            }
        }
    });
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`[WeatherGPT Analytics] Server listening on port ${PORT}`);
        console.log(`[WeatherGPT Analytics] REST Endpoints active under /api/analytics/*`);
    });
}
export default app;
