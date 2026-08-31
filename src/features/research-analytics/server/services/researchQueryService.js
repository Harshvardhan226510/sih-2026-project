import { resolveLocation, INDIAN_LOCATIONS } from '../utils/validation.js';
import { HistoricalService } from './historicalService.js';
import { TrendService } from './trendService.js';
import { AnomalyService } from './anomalyService.js';
import { ComparisonService } from './comparisonService.js';
import { ExtremeEventService } from './extremeService.js';
import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter.js';
export class ResearchQueryService {
    historicalService;
    trendService;
    anomalyService;
    comparisonService;
    extremeService;
    constructor(adapter) {
        const adp = adapter || new OpenMeteoAdapter();
        this.historicalService = new HistoricalService(adp);
        this.trendService = new TrendService(adp);
        this.anomalyService = new AnomalyService(adp);
        this.comparisonService = new ComparisonService(adp);
        this.extremeService = new ExtremeEventService(adp);
    }
    parseIntent(query, preferredLocation) {
        const q = query.toLowerCase();
        // Extract metric
        let metric = 'rainfall';
        if (q.includes('temp') || q.includes('heat') || q.includes('warmth') || q.includes('cold')) {
            metric = 'temperature';
        }
        else if (q.includes('humid')) {
            metric = 'humidity';
        }
        else if (q.includes('wind') || q.includes('cyclone') || q.includes('gale')) {
            metric = 'wind_speed';
        }
        else if (q.includes('press')) {
            metric = 'pressure';
        }
        // Extract locations
        const matchedLocations = [];
        for (const key of Object.keys(INDIAN_LOCATIONS)) {
            if (q.includes(key)) {
                if (!matchedLocations.includes(INDIAN_LOCATIONS[key].name)) {
                    matchedLocations.push(INDIAN_LOCATIONS[key].name);
                }
            }
        }
        if (matchedLocations.length === 0) {
            matchedLocations.push(preferredLocation || 'Pune');
        }
        // Extract years: "2015 to 2025", "2018-2023", "2020", etc.
        const yearMatches = query.match(/\b(19\d\d|20\d\d)\b/g);
        let startDate = '2015-01-01';
        let endDate = '2024-12-31';
        if (yearMatches && yearMatches.length >= 2) {
            const y1 = parseInt(yearMatches[0], 10);
            const y2 = parseInt(yearMatches[1], 10);
            const startYear = Math.min(y1, y2);
            const endYear = Math.max(y1, y2);
            startDate = `${startYear}-01-01`;
            endDate = `${endYear}-12-31`;
        }
        else if (yearMatches && yearMatches.length === 1) {
            const y = parseInt(yearMatches[0], 10);
            startDate = `${y}-01-01`;
            endDate = `${y}-12-31`;
        }
        // Extract season
        let season;
        if (q.includes('monsoon') || q.includes('rainy'))
            season = 'Monsoon';
        else if (q.includes('summer'))
            season = 'Summer';
        else if (q.includes('winter'))
            season = 'Winter';
        else if (q.includes('post-monsoon') || q.includes('autumn'))
            season = 'Post-Monsoon';
        // Extract analysis type
        let type = 'HISTORICAL';
        if (matchedLocations.length >= 2 || q.includes('compare') || q.includes(' vs ') || q.includes('versus') || q.includes('difference')) {
            type = 'COMPARISON';
        }
        else if (q.includes('anomaly') || q.includes('unusual') || q.includes('abnormal') || q.includes('baseline')) {
            type = 'ANOMALY';
        }
        else if (q.includes('trend') || q.includes('increase') || q.includes('decrease') || q.includes('changing') || q.includes('long-term')) {
            type = 'TREND';
        }
        else if (q.includes('extreme') || q.includes('heatwave') || q.includes('flood') || q.includes('cloudburst')) {
            type = 'EXTREME';
        }
        let aggregation = 'yearly';
        if (q.includes('month'))
            aggregation = 'monthly';
        else if (q.includes('day') || q.includes('daily'))
            aggregation = 'daily';
        else if (q.includes('week'))
            aggregation = 'weekly';
        return {
            type,
            metric,
            locations: matchedLocations,
            dateRange: { start: startDate, end: endDate },
            aggregation,
            season
        };
    }
    async processResearchQuery(request) {
        const parsed = this.parseIntent(request.query, request.preferredLocation);
        const locA = resolveLocation(parsed.locations[0]);
        let analyticsData = null;
        let chartType = 'line';
        let explanation = '';
        const keyInsights = [];
        let provenance = null;
        if (parsed.type === 'COMPARISON') {
            const locB = resolveLocation(parsed.locations[1] || 'Mumbai');
            const compRes = await this.comparisonService.compareLocations(locA, locB, parsed.dateRange.start, parsed.dateRange.end, parsed.metric);
            analyticsData = compRes;
            chartType = 'comparison-line';
            explanation = compRes.analyticalExplanation;
            keyInsights.push(`${compRes.comparisonSummary.higherLocation} recorded higher overall ${parsed.metric} by ${Math.abs(compRes.comparisonSummary.percentDifference)}%.`);
            keyInsights.push(`${locA.name} had ${compRes.locationA.extremeEventsCount} extreme events vs ${compRes.locationB.extremeEventsCount} in ${locB.name}.`);
            keyInsights.push(`Inter-station variability difference is ${compRes.comparisonSummary.variabilityDifference}%.`);
            provenance = compRes.provenance;
        }
        else if (parsed.type === 'TREND') {
            const trendRes = await this.trendService.getTrendAnalytics(locA, parsed.dateRange.start, parsed.dateRange.end, parsed.metric);
            analyticsData = trendRes;
            chartType = 'line';
            explanation = trendRes.analyticalExplanation;
            keyInsights.push(`Trajectory: ${trendRes.trendDirection} (${trendRes.slopePerYear > 0 ? '+' : ''}${trendRes.slopePerYear}/year).`);
            keyInsights.push(`Total percentage change over the evaluation window: ${trendRes.percentageChange > 0 ? '+' : ''}${trendRes.percentageChange}%.`);
            keyInsights.push(`Inter-annual variability: ${trendRes.variabilityPercent}%.`);
            provenance = trendRes.provenance;
        }
        else if (parsed.type === 'ANOMALY') {
            const anomRes = await this.anomalyService.getAnomalyAnalytics(locA, parsed.dateRange.start, parsed.dateRange.end, undefined, undefined, parsed.metric);
            analyticsData = anomRes;
            chartType = 'bar';
            explanation = anomRes.explanation;
            keyInsights.push(`Observed Value: ${anomRes.observedValue} vs Historical Baseline: ${anomRes.historicalBaseline}.`);
            keyInsights.push(`Anomaly Status: ${anomRes.badgeLabel}.`);
            keyInsights.push(`Statistical Z-score deviation: ${anomRes.zScore}.`);
            provenance = anomRes.provenance;
        }
        else if (parsed.type === 'EXTREME') {
            const extRes = await this.extremeService.detectExtremeEvents(locA, parsed.dateRange.start, parsed.dateRange.end);
            analyticsData = extRes;
            chartType = 'timeline';
            explanation = `Extreme meteorological event analytics for ${locA.name} detected ${extRes.totalEvents} threshold-exceeding events between ${parsed.dateRange.start} and ${parsed.dateRange.end}.`;
            keyInsights.push(`Total Extreme Events Detected: ${extRes.totalEvents}.`);
            if (extRes.events.length > 0) {
                keyInsights.push(`Peak event: ${extRes.events[0].measuredValue} ${extRes.events[0].unit} on ${extRes.events[0].date}.`);
            }
            provenance = extRes.provenance;
        }
        else {
            // Historical
            const histRes = await this.historicalService.getHistoricalAnalytics(locA, parsed.dateRange.start, parsed.dateRange.end, parsed.metric, parsed.aggregation);
            analyticsData = histRes;
            chartType = parsed.metric === 'rainfall' ? 'bar' : 'line';
            explanation = `Historical ${parsed.metric} evaluation for ${locA.name} across ${histRes.dataPoints.length} aggregated periods (${parsed.dateRange.start} to ${parsed.dateRange.end}). Mean recorded value: ${histRes.summary.mean} ${histRes.summary.unit}.`;
            keyInsights.push(`Mean: ${histRes.summary.mean} ${histRes.summary.unit}, Min: ${histRes.summary.min}, Max: ${histRes.summary.max}.`);
            keyInsights.push(`95th Percentile: ${histRes.summary.p95} ${histRes.summary.unit}.`);
            provenance = histRes.provenance;
        }
        return {
            query: request.query,
            parsedIntent: parsed,
            analyticsData,
            chartType,
            analyticalExplanation: explanation,
            keyInsights,
            provenance
        };
    }
}
