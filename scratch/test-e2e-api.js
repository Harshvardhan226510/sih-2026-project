import app from './src/features/alerts/server/app.js';
import { initDb, closeDb } from './src/features/alerts/server/db/connection.js';

let server;

async function runE2ETests() {
    console.log('=== RUNNING END-TO-END HTTP API INTEGRATION TESTS ===');
    await initDb();
    
    const PORT = 4055;
    server = app.listen(PORT);
    console.log(`Test Express server listening on port ${PORT}...`);

    let passed = 0;
    let failed = 0;

    function assert(cond, msg) {
        if (cond) {
            console.log(`  [PASS] ${msg}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${msg}`);
            failed++;
        }
    }

    try {
        const BASE_URL = `http://localhost:${PORT}/api/analytics`;

        // 1. GET /api/analytics/historical (Percentiles, Distributions, Aggregations)
        console.log('\n--- 1. Testing GET /api/analytics/historical ---');
        const resHist = await fetch(`${BASE_URL}/historical?location=Pune&start_date=2022-01-01&end_date=2022-12-31&metric=rainfall&aggregation=monthly`);
        assert(resHist.ok, `HTTP status 200 OK`);
        const jsonHist = await resHist.json();
        assert(jsonHist.summary.p10 !== undefined && jsonHist.summary.p90 !== undefined, `P10 & P90 present in summary`);
        assert(jsonHist.dataPoints.length === 12, `12 monthly points returned (got ${jsonHist.dataPoints.length})`);
        assert(jsonHist.dataPoints[0].percentileRank !== undefined, `Point has percentileRank (${jsonHist.dataPoints[0].percentileRank}%)`);

        // 2. GET /api/analytics/compare (2 to 4 locations)
        console.log('\n--- 2. Testing GET /api/analytics/compare (Multi-Location 2-4 stations) ---');
        const locs = [
            { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.52, lon: 73.85 },
            { name: 'Nashik', state: 'Maharashtra', country: 'India', lat: 19.99, lon: 73.78 },
            { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.07, lon: 72.87 }
        ];
        const resComp = await fetch(`${BASE_URL}/compare?locations=${encodeURIComponent(JSON.stringify(locs))}&start_date=2022-01-01&end_date=2022-01-10&metric=rainfall`);
        assert(resComp.ok, `Multi-location comparison HTTP 200 OK`);
        const jsonComp = await resComp.json();
        assert(jsonComp.locations.length === 3, `3 locations compared (got ${jsonComp.locations.length})`);
        assert(jsonComp.locations[0].rank === 1, `Rank 1 assigned to top station (${jsonComp.locations[0].name})`);
        assert(jsonComp.timeSeries.length === 10, `Synchronized time-series has 10 days`);

        // 3. GET /api/analytics/compare (Period-vs-Period)
        console.log('\n--- 3. Testing GET /api/analytics/compare (Period-vs-Period Mode) ---');
        const resPeriods = await fetch(`${BASE_URL}/compare?mode=periods&location=Pune&period_a_start=2015-01-01&period_a_end=2018-12-31&period_b_start=2019-01-01&period_b_end=2022-12-31&metric=temperature`);
        assert(resPeriods.ok, `Period comparison HTTP 200 OK`);
        const jsonPeriods = await resPeriods.json();
        assert(jsonPeriods.periodA.stats.mean !== undefined, `Period A mean calculated (${jsonPeriods.periodA.stats.mean}°C)`);
        assert(jsonPeriods.periodB.stats.mean !== undefined, `Period B mean calculated (${jsonPeriods.periodB.stats.mean}°C)`);
        assert(typeof jsonPeriods.differences.percentChange === 'number', `Percentage difference calculated safely (${jsonPeriods.differences.percentChange}%)`);

        // 4. GET /api/analytics/extremes (Explorer with rankings)
        console.log('\n--- 4. Testing GET /api/analytics/extremes (Explorer with rankings) ---');
        const resExt = await fetch(`${BASE_URL}/extremes?location=Pune&start_date=2020-01-01&end_date=2023-12-31&metric=rainfall&top_n=5`);
        assert(resExt.ok, `Extremes HTTP 200 OK`);
        const jsonExt = await resExt.json();
        assert(jsonExt.events.length <= 5, `Top-5 filtering applied (got ${jsonExt.events.length})`);
        if (jsonExt.events.length > 0) {
            assert(jsonExt.events[0].rank === 1, `Rank 1 assigned (${jsonExt.events[0].rankLabel})`);
        }

        // 5. GET /api/analytics/extremes (Recurrence Mode)
        console.log('\n--- 5. Testing GET /api/analytics/extremes (Recurrence Mode) ---');
        const resRec = await fetch(`${BASE_URL}/extremes?mode=recurrence&location=Pune&start_date=2015-01-01&end_date=2023-12-31&metric=rainfall&threshold=35`);
        assert(resRec.ok, `Recurrence HTTP 200 OK`);
        const jsonRec = await resRec.json();
        assert(typeof jsonRec.annualFrequencyEventsPerYear === 'number', `Annual frequency: ${jsonRec.annualFrequencyEventsPerYear} events/yr`);
        assert(jsonRec.methodologyNote.includes('empirical historical event intervals'), `Explicit non-probabilistic empirical interval label`);

        // 6. GET /api/analytics/anomaly (Automatic detection & baseline)
        console.log('\n--- 6. Testing GET /api/analytics/anomaly (Automatic Anomaly Detection) ---');
        const resAnom = await fetch(`${BASE_URL}/anomaly?location=Pune&start_date=2023-06-01&end_date=2023-09-30&baseline_start=1991-01-01&baseline_end=2020-12-31&metric=rainfall`);
        assert(resAnom.ok, `Anomaly HTTP 200 OK`);
        const jsonAnom = await resAnom.json();
        assert(jsonAnom.detectedAnomaliesCount !== undefined, `Anomalies count: ${jsonAnom.detectedAnomaliesCount}`);
        assert(jsonAnom.baselinePeriod.isWMOStandardBaseline === true, `Identified standard 1991-2020 baseline`);

        // 7. GET /api/analytics/trends (Significance & Seasonal)
        console.log('\n--- 7. Testing GET /api/analytics/trends (Mann-Kendall & Seasonal) ---');
        const resTrends = await fetch(`${BASE_URL}/trends?location=Pune&start_date=2015-01-01&end_date=2023-12-31&metric=temperature`);
        assert(resTrends.ok, `Trends HTTP 200 OK`);
        const jsonTrends = await resTrends.json();
        assert(jsonTrends.significance.mannKendallTau !== undefined, `Mann-Kendall Tau: ${jsonTrends.significance.mannKendallTau}`);
        assert(jsonTrends.significance.confidenceInterval95.length === 2, `95% CI: [${jsonTrends.significance.confidenceInterval95.join(', ')}]`);
        assert(jsonTrends.seasonalBreakdown.length === 4, `4 Indian seasons categorized`);

        // 8. POST /api/analytics/explain/explain-trend (WeatherGPT explanation)
        console.log('\n--- 8. Testing POST /api/analytics/explain/explain-trend ---');
        const resExplain = await fetch(`${BASE_URL}/explain/explain-trend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trendData: jsonTrends })
        });
        assert(resExplain.ok, `Explain trend HTTP 200 OK`);
        const jsonExplain = await resExplain.json();
        assert(jsonExplain.explanation.length > 50, `Scientific explanation generated`);
        assert(jsonExplain.systemPrompt.includes('DO NOT calculate, alter, or invent ANY numerical values'), `Strict prompt guard against numerical hallucination verified`);

        // 9. POST & GET /api/analytics/recent-queries
        console.log('\n--- 9. Testing GET & POST /api/analytics/recent-queries ---');
        const postRes = await fetch(`${BASE_URL}/recent-queries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queryType: 'EXPLORE',
                title: 'Pune • Rainfall (2015-2024)',
                location: { name: 'Pune', lat: 18.52, lon: 73.85 },
                params: { metric: 'rainfall', start: '2015-01-01', end: '2024-12-31' }
            })
        });
        assert(postRes.ok, `Save recent query HTTP 200 OK`);

        const getRes = await fetch(`${BASE_URL}/recent-queries?limit=5`);
        assert(getRes.ok, `Get recent queries HTTP 200 OK`);
        const jsonRecent = await getRes.json();
        assert(jsonRecent.queries.length >= 1, `Recent queries retrieved from SQLite (count = ${jsonRecent.queries.length})`);

        console.log(`\n=== API TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
    } catch (e) {
        console.error('API Test Failed:', e);
    } finally {
        server.close();
        closeDb();
    }
}

runE2ETests();
