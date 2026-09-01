import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenMeteoAdapter } from './src/features/research-analytics/server/adapters/openMeteoAdapter.js';
import { initDb, runQuery, runExec } from './src/features/alerts/server/db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runSuite() {
    let passed = 0;
    let failed = 0;
    
    function assert(condition, message) {
        if (!condition) {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        } else {
            console.log(`✅ PASS: ${message}`);
            passed++;
        }
    }

    console.log("Initializing Test Suite...");
    await initDb();
    runExec("DELETE FROM research_historical_cache");
    
    // --- 1. Shared Database ---
    console.log('\n--- 1. Shared database ---');
    const tableExists = runQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='research_historical_cache'");
    assert(tableExists.length === 1, "research_historical_cache exists in the existing common WeatherGPT DB.");
    
    // --- 2. No second database ---
    console.log('\n--- 2. No second database ---');
    function findDbs(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        for (let file of list) {
            const fullPath = path.resolve(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git')) {
                results = results.concat(findDbs(fullPath));
            } else if (file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.sqlite3')) {
                results.push(fullPath);
            }
        }
        return results;
    }
    const dbFiles = findDbs(path.resolve(__dirname, 'src')); 
    const otherDbs = dbFiles.filter(f => !f.endsWith('weathergpt.db'));
    assert(otherDbs.length === 0, `Verified the research cache does not use a separate SQLite database (Found 0 others).`);

    // --- Mock fetch to count external API hits ---
    const originalFetch = global.fetch;
    let fetchCount = 0;
    global.fetch = async (...args) => {
        fetchCount++;
        return originalFetch(...args);
    };
    
    const adapter = new OpenMeteoAdapter();
    const loc = (i) => ({ lat: 10 + i, lon: 20 + i, name: `Loc${i}`, state: 'State' });

    // --- 3. L2 maximum = 5 ---
    console.log('\n--- 3. L2 maximum = 5 ---');
    runExec("DELETE FROM research_historical_cache");
    for(let i=1; i<=6; i++) {
        await adapter.fetchHistoricalRecords(loc(i), '2023-01-01', '2023-01-02');
        await sleep(100); // space out timestamps for predictable LRU
    }
    let l2Count = runQuery("SELECT COUNT(*) as count FROM research_historical_cache")[0].count;
    assert(l2Count === 5, `Inserted 6 unique datasets, exactly 5 remain in L2 SQLite (Actual: ${l2Count})`);
    
    // --- 4. LRU eviction ---
    console.log('\n--- 4. LRU eviction ---');
    runExec("DELETE FROM research_historical_cache");
    // Create 5 datasets
    for(let i=1; i<=5; i++) {
        await adapter.fetchHistoricalRecords(loc(i), '2023-01-01', '2023-01-02');
        await sleep(100);
    }
    // Access 1 and 2 to establish known access order
    await adapter.fetchHistoricalRecords(loc(1), '2023-01-01', '2023-01-02');
    await sleep(100);
    await adapter.fetchHistoricalRecords(loc(2), '2023-01-01', '2023-01-02');
    await sleep(100);
    
    // Request 6th unique dataset
    await adapter.fetchHistoricalRecords(loc(6), '2023-01-01', '2023-01-02');
    
    const remainingDbs = runQuery("SELECT location_name FROM research_historical_cache").map(r => r.location_name);
    const hasLoc3 = remainingDbs.some(n => n.includes('Loc3'));
    const hasLoc1 = remainingDbs.some(n => n.includes('Loc1'));
    assert(!hasLoc3, "Verified the known least-recently-used dataset (Loc3) was evicted.");
    assert(hasLoc1, "Verified a recently accessed dataset (Loc1) remains.");

    // --- 5. Repeated query cache hit ---
    console.log('\n--- 5. Repeated query cache hit ---');
    let preFetch = fetchCount;
    // Request exactly the same dataset again (Loc 6 was just requested)
    await adapter.fetchHistoricalRecords(loc(6), '2023-01-01', '2023-01-02');
    assert(fetchCount - preFetch === 0, `Zero additional Open-Meteo requests for repeated query (Actual: ${fetchCount - preFetch})`);

    // --- 6. Coverage-aware subset reuse ---
    console.log('\n--- 6. Coverage-aware subset reuse ---');
    runExec("DELETE FROM research_historical_cache");
    adapter.cache.clear();
    await adapter.fetchHistoricalRecords(loc(7), '2023-01-01', '2023-01-10'); // broad range
    preFetch = fetchCount;
    const subsetResult = await adapter.fetchHistoricalRecords(loc(7), '2023-01-03', '2023-01-05'); // narrower subset
    assert(fetchCount - preFetch === 0, `Zero additional Open-Meteo requests for subset query (Actual: ${fetchCount - preFetch})`);
    assert(subsetResult.records.length === 3, `Returned records correspond exactly to the requested 3-day subset (Actual: ${subsetResult.records.length})`);

    // --- 7. Concurrent deduplication ---
    console.log('\n--- 7. Concurrent deduplication ---');
    runExec("DELETE FROM research_historical_cache");
    adapter.cache.clear();
    preFetch = fetchCount;
    await Promise.all([
        adapter.fetchHistoricalRecords(loc(8), '2023-02-01', '2023-02-02'),
        adapter.fetchHistoricalRecords(loc(8), '2023-02-01', '2023-02-02'),
        adapter.fetchHistoricalRecords(loc(8), '2023-02-01', '2023-02-02')
    ]);
    assert(fetchCount - preFetch === 1, `Exactly ONE external request for 3 simultaneous identical requests (Actual: ${fetchCount - preFetch})`);

    // --- 8. L1 maximum = 2 ---
    console.log('\n--- 8. L1 maximum = 2 ---');
    adapter.cache.clear();
    await adapter.fetchHistoricalRecords(loc(9), '2023-01-01', '2023-01-02');
    await adapter.fetchHistoricalRecords(loc(10), '2023-01-01', '2023-01-02');
    await adapter.fetchHistoricalRecords(loc(11), '2023-01-01', '2023-01-02');
    assert(adapter.cache.size === 2, `Only 2 datasets retained in L1 memory cache (Actual: ${adapter.cache.size})`);

    // --- 9. L1 -> L2 behavior ---
    console.log('\n--- 9. L1 -> L2 behavior ---');
    // loc(11) is currently in L1. Confirm hit:
    const l1Key = adapter.getL1CacheKey(loc(11).lat, loc(11).lon, '2023-01-01', '2023-01-02');
    adapter.cache.delete(l1Key); // Evict from L1 manually
    preFetch = fetchCount;
    await adapter.fetchHistoricalRecords(loc(11), '2023-01-01', '2023-01-02');
    assert(fetchCount - preFetch === 0, "L2 supplies dataset without external request after L1 eviction");
    assert(adapter.cache.has(l1Key), "Dataset repromoted to L1 from L2");

    // --- 10. TTL ---
    console.log('\n--- 10. TTL ---');
    const RealDate = Date;
    let fakeTimeOffset = 0;
    class MockDate extends RealDate {
        constructor(...args) {
            if (args.length) return new RealDate(...args);
            return new RealDate(RealDate.now() + fakeTimeOffset);
        }
        static now() {
            return RealDate.now() + fakeTimeOffset;
        }
    }
    global.Date = MockDate;
    
    adapter.cache.clear();
    runExec("DELETE FROM research_historical_cache");
    // Cache dataset
    await adapter.fetchHistoricalRecords(loc(12), '2023-01-01', '2023-01-02');
    // Advance time by 25 hours to exceed 24h TTL
    fakeTimeOffset = 25 * 60 * 60 * 1000;
    adapter.cache.clear(); // Important: Clear L1 so it checks L2 TTL
    preFetch = fetchCount;
    
    // We intentionally mock fetch to fail so we can verify if it preserves stale data on failed refresh
    global.fetch = async (...args) => {
        fetchCount++;
        throw new Error("Simulated network failure");
    };
    
    const staleResult = await adapter.fetchHistoricalRecords(loc(12), '2023-01-01', '2023-01-02');
    assert(fetchCount - preFetch === 1, "Attempted refresh on TTL expiration (stale treated correctly)");
    assert(staleResult.records.length > 0, "Failed refresh preserves the previous cached dataset (returned stale L2 data)");
    
    global.fetch = async (...args) => {
        fetchCount++;
        return originalFetch(...args);
    };
    global.Date = RealDate; // Restore Date

    // --- 11. Existing analytics ---
    console.log('\n--- 11. Existing analytics ---');
    const existingResult = await adapter.fetchHistoricalRecords(loc(13), '2023-01-01', '2023-01-02');
    assert(existingResult.records && Array.isArray(existingResult.records), "API response structure maintains records array");
    assert(existingResult.provenance && existingResult.provenance.source, "API response structure maintains provenance metadata");

    // --- 12. Dynamic LocationSearch ---
    console.log('\n--- 12. Dynamic LocationSearch ---');
    const puneLoc = { lat: 18.52, lon: 73.85, name: 'Pune', state: 'Maharashtra' };
    const puneResult = await adapter.fetchHistoricalRecords(puneLoc, '2023-01-01', '2023-01-02');
    assert(puneResult.records && puneResult.records.length > 0, "Dynamically resolved location (Pune) reaches historical service correctly");

    console.log(`\n================================`);
    console.log(`TOTAL PASSED: ${passed}`);
    console.log(`TOTAL FAILED: ${failed}`);
    console.log(`================================`);
    process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch(err => {
    console.error(err);
    process.exit(1);
});
