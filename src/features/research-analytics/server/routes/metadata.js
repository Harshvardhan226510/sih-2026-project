import { Router } from 'express';
import { INDIAN_LOCATIONS, VALID_AGGREGATIONS } from '../utils/validation.js';
const router = Router();
/**
 * GET /api/analytics/metadata
 * Returns available parameters, locations, data sources, and scientific methods.
 */
router.get('/', (_req, res) => {
    return res.json({
        platform: 'WeatherGPT Research & Analytics Module',
        version: '1.0.0',
        supportedLocations: Object.values(INDIAN_LOCATIONS).map(loc => ({
            name: loc.name,
            state: loc.state,
            coordinates: { lat: loc.lat, lon: loc.lon },
            elevation: loc.elevation
        })),
        supportedMetrics: [
            { id: 'rainfall', label: 'Rainfall / Precipitation', unit: 'mm', description: 'Accumulated precipitation sum' },
            { id: 'temperature', label: 'Mean Temperature', unit: '°C', description: '2-meter daily mean air temperature' },
            { id: 'temp_max', label: 'Max Temperature', unit: '°C', description: '2-meter maximum air temperature' },
            { id: 'temp_min', label: 'Min Temperature', unit: '°C', description: '2-meter minimum air temperature' },
            { id: 'humidity', label: 'Relative Humidity', unit: '%', description: '2-meter mean relative humidity' },
            { id: 'wind_speed', label: 'Wind Speed', unit: 'km/h', description: '10-meter maximum wind speed' },
            { id: 'pressure', label: 'Surface Pressure', unit: 'hPa', description: 'Mean atmospheric pressure at surface' },
            { id: 'cloud_cover', label: 'Cloud Cover', unit: '%', description: 'Total tropospheric cloud fraction' }
        ],
        supportedAggregations: VALID_AGGREGATIONS,
        dataSources: [
            {
                name: 'Open-Meteo ERA5 Reanalysis',
                coverage: '1940 - Present',
                resolution: '0.1° (~11 km)',
                provider: 'ECMWF / Copernicus Climate Change Service',
                status: 'ONLINE'
            },
            {
                name: 'IMD Climatological Reference Baseline',
                coverage: 'Standard 30-Year Climatological Normal (1991-2020)',
                provider: 'India Meteorological Department (IMD)',
                status: 'VERIFIED'
            },
            {
                name: 'Deterministic NWP Operational Forecast',
                coverage: 'D+0 to D+16 Lead Time',
                provider: 'ECMWF IFS / GFS',
                status: 'ONLINE'
            }
        ]
    });
});
export default router;
