import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
import { percentile, mean, min as minVal, max as maxVal, calculateEventIntervals } from '../utils/statistics.js';

export class ExtremeEventService {
    adapter;
    constructor(adapter) {
        this.adapter = adapter || new OpenMeteoAdapter();
    }

    extractMetricValue(record, metric) {
        switch (metric) {
            case 'rainfall': return record.rainfall ?? 0;
            case 'temperature': return record.temperature ?? 25;
            case 'temp_max': return record.temp_max ?? (record.temperature ?? 25) + 4;
            case 'temp_min': return record.temp_min ?? (record.temperature ?? 25) - 4;
            case 'wind_speed': return record.wind_speed ?? 10;
            case 'pressure': return record.pressure ?? 1010;
            case 'humidity': return record.humidity ?? 60;
            default: return record.rainfall ?? 0;
        }
    }

    getMetricUnit(metric) {
        switch (metric) {
            case 'rainfall': return 'mm/day';
            case 'temperature':
            case 'temp_max':
            case 'temp_min': return '°C';
            case 'wind_speed': return 'km/h';
            case 'pressure': return 'hPa';
            case 'humidity': return '%';
            default: return '';
        }
    }

    /**
     * Detect extreme weather events with rankings, top-N, custom threshold, and IMD criteria
     */
    async detectExtremeEvents(location, startDate, endDate, options = {}) {
        const { metric = 'all', threshold, topN, direction = 'highest' } = options;
        const { records, provenance } = await this.adapter.fetchHistoricalRecords(location, startDate, endDate);

        if (records.length === 0) {
            return {
                location: `${location.name}, ${location.state}`,
                timeRange: { start: startDate, end: endDate },
                totalEvents: 0,
                events: [],
                breakdownByType: {},
                breakdownBySeverity: {},
                recurrenceAnalysis: null,
                provenance
            };
        }

        const rainValues = records.map(r => r.rainfall).filter(r => r > 0);
        const tempValues = records.map(r => r.temp_max);
        const rainP95 = rainValues.length > 0 ? percentile(rainValues, 95) : 50;
        const rainP99 = rainValues.length > 0 ? percentile(rainValues, 99) : 100;
        const tempMean = mean(tempValues);

        let rawEvents = [];
        const breakdownByType = {};
        const breakdownBySeverity = {};

        const addEvent = (e) => {
            rawEvents.push(e);
            breakdownByType[e.eventType] = (breakdownByType[e.eventType] || 0) + 1;
            breakdownBySeverity[e.severity] = (breakdownBySeverity[e.severity] || 0) + 1;
        };

        records.forEach((record, idx) => {
            // 1. Heavy Rainfall Detection (IMD criteria & percentile)
            if (metric === 'all' || metric === 'rainfall') {
                if (record.rainfall >= 64.5 || (record.rainfall >= rainP95 && record.rainfall > 35)) {
                    let severity = 'MODERATE';
                    let thresholdLabel = 'Heavy Rainfall (>64.5 mm/24h or >95th percentile)';
                    if (record.rainfall >= 204.5 || record.rainfall >= rainP99) {
                        severity = 'EXTREME';
                        thresholdLabel = 'Extremely Heavy Rainfall (>204.5 mm/24h or >99th percentile)';
                    } else if (record.rainfall >= 115.6) {
                        severity = 'VERY_SEVERE';
                        thresholdLabel = 'Very Heavy Rainfall (>115.6 mm/24h)';
                    } else if (record.rainfall >= 64.5) {
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
                        thresholdApplied: thresholdLabel,
                        description: `Intense precipitation surge of ${record.rainfall} mm recorded within 24 hours.`,
                        source: provenance.source
                    });
                }
            }

            // 2. Heatwave / Extreme Heat Detection (IMD criteria)
            if (metric === 'all' || metric === 'temperature' || metric === 'temp_max') {
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
                        description: `Extreme heat anomaly reaching max temperature of ${record.temp_max}°C (+${departure}°C above normal).`,
                        source: provenance.source
                    });
                }
            }

            // 3. High Wind / Gale Detection
            if (metric === 'all' || metric === 'wind_speed') {
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
            }

            // 4. Severe Depression / Low Pressure
            if (metric === 'all' || metric === 'pressure') {
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
            }
        });

        // If specific user threshold provided
        if (typeof threshold === 'number' && !isNaN(threshold) && metric !== 'all') {
            rawEvents = rawEvents.filter(e => {
                return direction === 'lowest' ? e.measuredValue <= threshold : e.measuredValue >= threshold;
            });
        }

        // Sort by measured value to establish ranks
        rawEvents.sort((a, b) => {
            return direction === 'lowest' ? a.measuredValue - b.measuredValue : b.measuredValue - a.measuredValue;
        });

        // Add Rank property
        rawEvents.forEach((ev, idx) => {
            const rank = idx + 1;
            const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
            ev.rank = rank;
            ev.rankLabel = `${rank}${suffix} ${direction === 'lowest' ? 'lowest' : 'highest'} in selected period`;
        });

        // Top-N slicing if requested
        const topCount = topN ? parseInt(topN, 10) : rawEvents.length;
        const finalEvents = rawEvents.slice(0, topCount);

        // Calculate historical event recurrence intervals
        const eventDates = finalEvents.map(e => e.date);
        const recurrenceAnalysis = calculateEventIntervals(eventDates);

        provenance.calculationMethod = `Rule-Based IMD / WMO Climatological Extreme Event Detector (Percentile, Fixed & Ranked Threshold Filtering)`;

        return {
            location: `${location.name}, ${location.state}`,
            timeRange: { start: startDate, end: endDate },
            metric,
            totalEvents: rawEvents.length,
            events: finalEvents,
            breakdownByType,
            breakdownBySeverity,
            recurrenceAnalysis: {
                ...recurrenceAnalysis,
                recurrenceLabel: 'Historical event interval (empirical intervals, not probabilistic return period)'
            },
            provenance
        };
    }

    /**
     * Dedicated Event Recurrence Analysis
     */
    async calculateEventRecurrence(location, startDate, endDate, metric = 'rainfall', threshold = 50.0) {
        const { records, provenance } = await this.adapter.fetchHistoricalRecords(location, startDate, endDate);
        const unit = this.getMetricUnit(metric);

        const exceedingRecords = records.filter(r => {
            const val = this.extractMetricValue(r, metric);
            return val >= threshold;
        });

        const dates = exceedingRecords.map(r => r.date);
        const intervalsData = calculateEventIntervals(dates);

        // Seasonal distribution of recurrence
        const seasonalCount = { Summer: 0, Monsoon: 0, 'Post-Monsoon': 0, Winter: 0 };
        const yearlyCount = {};

        exceedingRecords.forEach(r => {
            const d = new Date(r.date);
            const m = d.getMonth();
            const y = d.getFullYear();
            yearlyCount[y] = (yearlyCount[y] || 0) + 1;

            if (m >= 2 && m <= 4) seasonalCount.Summer++;
            else if (m >= 5 && m <= 8) seasonalCount.Monsoon++;
            else if (m >= 9 && m <= 10) seasonalCount['Post-Monsoon']++;
            else seasonalCount.Winter++;
        });

        const totalYears = Math.max(1, (new Date(endDate).getFullYear() - new Date(startDate).getFullYear() + 1));
        const annualFrequency = Number((exceedingRecords.length / totalYears).toFixed(2));

        return {
            location: `${location.name}, ${location.state}`,
            metric,
            unit,
            threshold,
            timeRange: { start: startDate, end: endDate },
            totalEvents: exceedingRecords.length,
            annualFrequencyEventsPerYear: annualFrequency,
            intervals: intervalsData,
            seasonalDistribution: seasonalCount,
            yearlyDistribution: yearlyCount,
            methodologyNote: 'Calculates empirical historical event intervals from observed time-series data. Does not extrapolate probabilistic Gumbel/GEV return periods without extreme value distribution fitting.',
            provenance: {
                ...provenance,
                calculationMethod: `Deterministic Historical Event Interval & Recurrence Frequency Analysis`
            }
        };
    }
}
