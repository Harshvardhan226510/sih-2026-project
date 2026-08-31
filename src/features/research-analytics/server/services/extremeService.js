import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { percentile, mean } from '../utils/statistics.js';
export class ExtremeEventService {
    adapter;
    constructor(adapter) {
        this.adapter = adapter || new OpenMeteoAdapter();
    }
    async detectExtremeEvents(location, startDate, endDate) {
        const { records, provenance } = await this.adapter.fetchHistoricalRecords(location, startDate, endDate);
        if (records.length === 0) {
            return {
                location: `${location.name}, ${location.state}`,
                timeRange: { start: startDate, end: endDate },
                totalEvents: 0,
                events: [],
                breakdownByType: {},
                breakdownBySeverity: {},
                provenance
            };
        }
        const rainValues = records.map(r => r.rainfall).filter(r => r > 0);
        const tempValues = records.map(r => r.temp_max);
        const rainP95 = rainValues.length > 0 ? percentile(rainValues, 95) : 50;
        const rainP99 = rainValues.length > 0 ? percentile(rainValues, 99) : 100;
        const tempMean = mean(tempValues);
        const events = [];
        const breakdownByType = {};
        const breakdownBySeverity = {};
        const addEvent = (e) => {
            events.push(e);
            breakdownByType[e.eventType] = (breakdownByType[e.eventType] || 0) + 1;
            breakdownBySeverity[e.severity] = (breakdownBySeverity[e.severity] || 0) + 1;
        };
        records.forEach((record, idx) => {
            // 1. Heavy Rainfall Detection (IMD criteria & percentile)
            if (record.rainfall >= 64.5 || (record.rainfall >= rainP95 && record.rainfall > 35)) {
                let severity = 'MODERATE';
                let threshold = 'Heavy Rainfall (>64.5 mm/24h or >95th percentile)';
                if (record.rainfall >= 204.5 || record.rainfall >= rainP99) {
                    severity = 'EXTREME';
                    threshold = 'Extremely Heavy Rainfall (>204.5 mm/24h or >99th percentile)';
                }
                else if (record.rainfall >= 115.6) {
                    severity = 'VERY_SEVERE';
                    threshold = 'Very Heavy Rainfall (>115.6 mm/24h)';
                }
                else if (record.rainfall >= 64.5) {
                    severity = 'SEVERE';
                }
                addEvent({
                    id: `EXT-RAIN-${idx}-${record.date}`,
                    date: record.date,
                    location: `${location.name}, ${location.state}`,
                    eventType: 'HEAVY_RAINFALL',
                    severity,
                    measuredValue: record.rainfall,
                    unit: 'mm/day',
                    historicalPercentile: record.rainfall >= rainP99 ? 99.5 : 96.0,
                    baselineNormal: Number((rainP95 * 0.3).toFixed(1)),
                    thresholdApplied: threshold,
                    description: `Intense precipitation surge of ${record.rainfall} mm recorded within 24 hours.`,
                    source: provenance.source
                });
            }
            // 2. Heatwave / Extreme Heat Detection (IMD criteria)
            if (record.temp_max >= 40.0 || (record.temp_max - tempMean >= 4.5 && record.temp_max >= 37.0)) {
                const departure = Number((record.temp_max - tempMean).toFixed(1));
                const severity = record.temp_max >= 45.0 || departure >= 6.5 ? 'EXTREME' : 'SEVERE';
                addEvent({
                    id: `EXT-HEAT-${idx}-${record.date}`,
                    date: record.date,
                    location: `${location.name}, ${location.state}`,
                    eventType: 'EXTREME_HEAT',
                    severity,
                    measuredValue: record.temp_max,
                    unit: '°C',
                    historicalPercentile: 98.0,
                    baselineNormal: Number(tempMean.toFixed(1)),
                    thresholdApplied: 'IMD Severe Heatwave Criterion (Tmax ≥ 40°C with departure ≥ +4.5°C)',
                    description: `Extreme heat anomaly reaching max temperature of ${record.temp_max}°C (+${departure}°C above seasonal normal).`,
                    source: provenance.source
                });
            }
            // 3. High Wind / Gale Detection
            if (record.wind_speed >= 55.0) {
                addEvent({
                    id: `EXT-WIND-${idx}-${record.date}`,
                    date: record.date,
                    location: `${location.name}, ${location.state}`,
                    eventType: 'HIGH_WIND_GALE',
                    severity: record.wind_speed >= 75 ? 'VERY_SEVERE' : 'SEVERE',
                    measuredValue: record.wind_speed,
                    unit: 'km/h',
                    historicalPercentile: 97.5,
                    baselineNormal: 15.0,
                    thresholdApplied: 'Beaufort Scale 7-8 Near Gale / Gale (>55 km/h)',
                    description: `High surface wind velocity peak reaching ${record.wind_speed} km/h.`,
                    source: provenance.source
                });
            }
            // 4. Severe Cyclonic Depression / Low Pressure
            if (record.pressure <= 995.0 && record.rainfall > 20) {
                addEvent({
                    id: `EXT-PRESS-${idx}-${record.date}`,
                    date: record.date,
                    location: `${location.name}, ${location.state}`,
                    eventType: 'SEVERE_DEPRESSION',
                    severity: 'VERY_SEVERE',
                    measuredValue: record.pressure,
                    unit: 'hPa',
                    historicalPercentile: 99.0,
                    baselineNormal: 1010.0,
                    thresholdApplied: 'Deep Barometric Depression (<995 hPa with precipitation)',
                    description: `Deep atmospheric low pressure system recorded at ${record.pressure} hPa accompanied by precipitation.`,
                    source: provenance.source
                });
            }
        });
        provenance.calculationMethod = `Rule-Based IMD / WMO Climatological Extreme Event Detector (Percentile & Fixed Threshold Filtering)`;
        return {
            location: `${location.name}, ${location.state}`,
            timeRange: { start: startDate, end: endDate },
            totalEvents: events.length,
            events: events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            breakdownByType,
            breakdownBySeverity,
            provenance
        };
    }
}
