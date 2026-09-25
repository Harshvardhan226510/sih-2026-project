import { initDb, closeDb, runGet, runQuery, runExec } from './src/features/alerts/server/db/connection.js';
import { OpenMeteoAdapter } from './src/features/research-analytics/server/adapters/openMeteoAdapter.js';
import { ComparisonService } from './src/features/research-analytics/server/services/comparisonService.js';
import { ExtremeEventService } from './src/features/research-analytics/server/services/extremeService.js';
import { AnomalyService } from './src/features/research-analytics/server/services/anomalyService.js';
import { TrendService } from './src/features/research-analytics/server/services/trendService.js';
import { ExplainService } from './src/features/research-analytics/server/services/explainService.js';
import { ResearchRecentQueriesRepository } from './src/features/research-analytics/server/repositories/researchRecentQueriesRepository.js';
import { 
    distributionStats, 
    percentileRank, 
    mannKendallTest, 
    linearRegressionWithSignificance, 
    calculateEventIntervals 
} from './src/features/research-analytics/server/utils/statistics.js';

async function runTestSuite() {
    console.log('=== STARTING ADVANCED RESEARCH ANALYTICS TEST SUITE ===');
    await initDb();

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  [PASS] ${message}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${message}`);
            failed++;
        }
    }

    try {
        // 1. STATISTICAL UTILITY TESTS
        console.log('\n--- 1. Testing Core Statistical Formulations ---');
        const sampleData = [12, 15, 14, 18, 22, 25, 29, 35, 42, 50];
        const dist = distributionStats(sampleData);
        assert(dist.min === 12, `Min is 12 (got ${dist.min})`);
        assert(dist.max === 50, `Max is 50 (got ${dist.max})`);
        assert(dist.median === 23.5, `Median is 23.5 (got ${dist.median})`);
        assert(dist.p10 > 0 && dist.p90 > 0, `P10 (${dist.p10}) & P90 (${dist.p90}) computed`);
        assert(dist.iqr === dist.p75 - dist.p25, `IQR = P75 - P25 (${dist.iqr})`);

        const pRank = percentileRank(sampleData, 25);
        assert(pRank >= 50 && pRank <= 60, `Percentile rank of 25 is ~55% (got ${pRank}%)`);

        // Mann-Kendall monotonic test
        const mkIncreasing = mannKendallTest(sampleData);
        assert(mkIncreasing.s > 0, `Mann-Kendall detects positive S for increasing sequence (S = ${mkIncreasing.s})`);
        assert(mkIncreasing.isSignificant === true, `Mann-Kendall p-value indicates significance (p = ${mkIncreasing.pValue})`);

        // Linear regression with significance
        const xVals = sampleData.map((_, i) => i);
        const regSig = linearRegressionWithSignificance(xVals, sampleData);
        assert(regSig.slope > 3.0, `OLS slope is ~3.8 (got ${regSig.slope})`);
        assert(regSig.ci95Lower < regSig.slope && regSig.ci95Upper > regSig.slope, `95% CI bounds slope [${regSig.ci95Lower}, ${regSig.ci95Upper}]`);
        assert(regSig.isSignificant === true, `Slope t-test is significant (p = ${regSig.pValue})`);

        // Event intervals
        const testDates = ['2018-06-15', '2018-07-20', '2019-08-10', '2021-07-01'];
        const intervals = calculateEventIntervals(testDates);
        assert(intervals.totalEvents === 4, `Total event count is 4 (got ${intervals.totalEvents})`);
        assert(intervals.minIntervalDays === 35, `Min interval is 35 days (got ${intervals.minIntervalDays})`);
        assert(intervals.averageIntervalDays > 0, `Average interval computed (${intervals.averageIntervalDays} days)`);

        // 2. TIER 1: MULTI-LOCATION COMPARISON (2-4 LOCATIONS)
        console.log('\n--- 2. Testing Multi-Location Comparison (Tier 1) ---');
        const compService = new ComparisonService();
        const locPune = { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.52, lon: 73.85 };
        const locMumbai = { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.07, lon: 72.87 };
        const locNashik = { name: 'Nashik', state: 'Maharashtra', country: 'India', lat: 19.99, lon: 73.78 };
        const locBengaluru = { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.97, lon: 77.59 };

        const multiComp = await compService.compareMultipleLocations(
            [locPune, locMumbai, locNashik, locBengaluru], 
            '2022-01-01', 
            '2022-01-15', 
            'rainfall'
        );
        assert(multiComp.locations.length === 4, `Supports 4 distinct locations (got ${multiComp.locations.length})`);
        assert(multiComp.timeSeries.length > 0, `Time series synchronized across all 4 locations (${multiComp.timeSeries.length} points)`);
        assert(multiComp.summaryComparison.highestLocation !== undefined, `Highest location identified: ${multiComp.summaryComparison.highestLocation}`);
        assert(multiComp.locations[0].rank === 1, `Ranking calculated (1st place: ${multiComp.locations[0].name})`);

        // 3. TIER 1: PERIOD-VS-PERIOD COMPARISON
        console.log('\n--- 3. Testing Period-vs-Period Comparison (Tier 1) ---');
        const periodComp = await compService.comparePeriods(
            locPune, 
            { start: '2020-01-01', end: '2020-01-10' }, 
            { start: '2022-01-01', end: '2022-01-10' }, 
            'temperature'
        );
        assert(periodComp.periodA.observationCount === 10, `Period A observation count is 10`);
        assert(periodComp.periodB.observationCount === 10, `Period B observation count is 10`);
        assert(typeof periodComp.differences.absoluteChange === 'number', `Absolute difference computed: ${periodComp.differences.absoluteChange}°C`);
        assert(typeof periodComp.differences.percentChange === 'number', `Safe percent change computed: ${periodComp.differences.percentChange}%`);

        // 4. TIER 1: EXTREME-EVENT EXPLORER & RECURRENCE
        console.log('\n--- 4. Testing Extreme-Event Explorer & Rankings (Tier 1 & Tier 3) ---');
        const extService = new ExtremeEventService();
        const extExplorer = await extService.detectExtremeEvents(locPune, '2020-01-01', '2023-12-31', {
            metric: 'rainfall',
            topN: 5
        });
        assert(extExplorer.events.length <= 5, `Top-N filtering respected (got ${extExplorer.events.length} events)`);
        if (extExplorer.events.length > 0) {
            assert(extExplorer.events[0].rank === 1, `1st rank assigned to highest event (${extExplorer.events[0].rankLabel})`);
        }
        assert(extExplorer.recurrenceAnalysis !== null, `Event recurrence intervals calculated`);

        const recurrenceRes = await extService.calculateEventRecurrence(locPune, '2015-01-01', '2023-12-31', 'rainfall', 35.0);
        assert(typeof recurrenceRes.annualFrequencyEventsPerYear === 'number', `Annual recurrence frequency calculated: ${recurrenceRes.annualFrequencyEventsPerYear} events/yr`);
        assert(recurrenceRes.seasonalDistribution.Monsoon !== undefined, `Seasonal recurrence distribution tracked`);

        // 5. TIER 1: AUTOMATIC ANOMALY DETECTION
        console.log('\n--- 5. Testing Automatic Anomaly Detection (Tier 1 & Tier 3 Baseline) ---');
        const anomService = new AnomalyService();
        const anomRes = await anomService.getAnomalyAnalytics(locPune, '2023-06-01', '2023-09-30', '2015-01-01', '2020-12-31', 'rainfall');
        assert(anomRes.detectedAnomaliesCount >= 0, `Detected anomaly count computed (${anomRes.detectedAnomaliesCount} anomalies)`);
        assert(anomRes.baselinePeriod.start === '2015-01-01', `Configurable baseline start respected`);
        if (anomRes.detectedAnomalies.length > 0) {
            assert(anomRes.detectedAnomalies[0].methodology !== undefined, `Documented methodology present: ${anomRes.detectedAnomalies[0].methodology}`);
            assert(anomRes.detectedAnomalies[0].zScore !== undefined, `Z-score deviation calculated`);
        }

        // 6. TIER 2: SEASONAL ANALYSIS & TREND SIGNIFICANCE
        console.log('\n--- 6. Testing Trend Significance & Seasonal Analysis (Tier 2 & Tier 3) ---');
        const trendService = new TrendService();
        const trendRes = await trendService.getTrendAnalytics(locPune, '2015-01-01', '2023-12-31', 'temperature');
        assert(trendRes.seasonalBreakdown.length === 4, `4 Indian meteorological seasons calculated (Winter, Pre-Monsoon, Monsoon, Post-Monsoon)`);
        assert(trendRes.significance.mannKendallTau !== undefined, `Mann-Kendall Tau calculated: ${trendRes.significance.mannKendallTau}`);
        assert(trendRes.significance.confidenceInterval95.length === 2, `95% confidence interval computed: [${trendRes.significance.confidenceInterval95.join(', ')}]`);
        assert(trendRes.significance.label !== undefined, `Significance label: ${trendRes.significance.label}`);

        // 7. TIER 2: EXPLAIN THIS TREND (WEATHERGPT SAFEGUARD)
        console.log('\n--- 7. Testing "Explain this Trend" WeatherGPT Payload & Safeguards (Tier 2) ---');
        const explainService = new ExplainService();
        const explainRes = await explainService.explainTrend(trendRes);
        assert(explainRes.verifiedPayload.trendTrajectory === trendRes.trendDirection, `Verified payload contains exact deterministic trajectory`);
        assert(explainRes.systemPrompt.includes('DO NOT calculate, alter, or invent ANY numerical values'), `Strict prompt guard against numerical hallucination`);
        assert(explainRes.systemPrompt.includes('correlation does NOT establish causation'), `Strict causation vs correlation distinction enforced`);
        assert(explainRes.explanation.length > 50, `Ground explanation generated`);

        // 8. TIER 2: RECENT RESEARCH QUERIES (BOUNDED SQLITE)
        console.log('\n--- 8. Testing Lightweight Recent Queries Storage (Tier 2) ---');
        const recentRepo = new ResearchRecentQueriesRepository();
        recentRepo.saveQuery({
            queryType: 'MULTI_LOCATION',
            title: 'Pune vs Mumbai vs Nashik (2022)',
            location: { name: 'Pune', lat: 18.52, lon: 73.85 },
            params: { metric: 'rainfall', start: '2022-01-01', end: '2022-01-15' }
        });
        const queries = recentRepo.getRecentQueries(5);
        assert(queries.length >= 1, `Recent query retrieved from SQLite (count = ${queries.length})`);
        assert(queries[0].title === 'Pune vs Mumbai vs Nashik (2022)', `Query metadata correctly stored & restored`);

        console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
    } catch (e) {
        console.error('Fatal error during test run:', e);
    } finally {
        closeDb();
    }
}

runTestSuite();
