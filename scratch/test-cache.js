import { initDb, closeDb, runGet, runQuery, runExec } from './src/features/alerts/server/db/connection.js';
import { OpenMeteoAdapter } from './src/features/research-analytics/server/adapters/openMeteoAdapter.js';

async function runTests() {
  console.log('Initializing DB...');
  await initDb();
  
  // Clear any existing cache data just for the test run
  runExec('DELETE FROM research_historical_cache');
  
  const adapter = new OpenMeteoAdapter();
  
  // Helper to fetch
  const fetchLoc = async (name, lat, lon, start, end) => {
    console.log(`Fetching ${name} (${lat}, ${lon}) from ${start} to ${end}...`);
    return await adapter.fetchHistoricalRecords({ name, state: 'Test', lat, lon }, start, end);
  };
  
  const getCacheCount = () => runGet('SELECT COUNT(*) as count FROM research_historical_cache').count;
  
  try {
    // 1. Initial fetch -> Open-Meteo
    await fetchLoc('Pune', 18.52, 73.85, '2020-01-01', '2020-01-10');
    console.log(`L2 Cache Count after Pune: ${getCacheCount()}`);
    
    // 2. Exact match -> Cache Hit (L1)
    console.log('--- Identical request (Pune) ---');
    await fetchLoc('Pune', 18.52, 73.85, '2020-01-01', '2020-01-10');
    console.log(`L2 Cache Count (should be unchanged): ${getCacheCount()}`);
    
    // 3. Subset match -> Cache Hit (L2 Coverage)
    console.log('--- Subset request (Pune) ---');
    const subsetRes = await fetchLoc('Pune', 18.52, 73.85, '2020-01-03', '2020-01-07');
    console.log(`Subset size: ${subsetRes.records.length} records. Cache count: ${getCacheCount()}`);
    
    // 4. Concurrency deduplication
    console.log('--- Concurrent requests (Nashik) ---');
    const p1 = fetchLoc('Nashik', 19.99, 73.78, '2020-01-01', '2020-01-10');
    const p2 = fetchLoc('Nashik', 19.99, 73.78, '2020-01-01', '2020-01-10');
    await Promise.all([p1, p2]);
    console.log(`L2 Cache Count after concurrent Nashik (should increment by 1): ${getCacheCount()}`);
    
    // 5. LRU Eviction Test
    console.log('--- LRU Eviction Test ---');
    await fetchLoc('Mumbai', 19.07, 72.87, '2020-01-01', '2020-01-05');
    await fetchLoc('Delhi', 28.61, 77.20, '2020-01-01', '2020-01-05');
    await fetchLoc('Chennai', 13.08, 80.27, '2020-01-01', '2020-01-05');
    console.log(`L2 Cache Count after 5 datasets: ${getCacheCount()}`);
    
    // Sixth dataset
    await fetchLoc('Kolkata', 22.57, 88.36, '2020-01-01', '2020-01-05');
    console.log(`L2 Cache Count after 6th dataset (should still be 5): ${getCacheCount()}`);
    
    const datasets = runGet('SELECT GROUP_CONCAT(location_name) as names FROM research_historical_cache').names;
    console.log('Current datasets in L2:', datasets);
    
    // Get size
    const sizeBytesRow = runQuery('SELECT location_name, size_bytes FROM research_historical_cache');
    sizeBytesRow.forEach(r => console.log(`- ${r.location_name}: ${Math.round(r.size_bytes / 1024)} KB`));
    
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    closeDb();
  }
}

runTests();
