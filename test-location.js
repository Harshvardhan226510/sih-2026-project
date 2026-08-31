import { resolveLocation, INDIAN_LOCATIONS } from './src/features/research-analytics/server/utils/validation.js';

function runTests() {
    let passed = 0;
    let failed = 0;
    
    function assertSuccess(input, desc) {
        try {
            const loc = resolveLocation(input);
            if (!loc || !loc.lat || !loc.country.toLowerCase().includes('india')) {
                console.error(`❌ FAIL: ${desc} - Returned invalid location object`, loc);
                failed++;
            } else {
                console.log(`✅ PASS: ${desc}`);
                passed++;
            }
        } catch(e) {
            console.error(`❌ FAIL: ${desc} - Threw error:`, e.message);
            failed++;
        }
    }
    
    function assertThrows(input, desc) {
        try {
            resolveLocation(input);
            console.error(`❌ FAIL: ${desc} - Did NOT throw error as expected.`);
            failed++;
        } catch(e) {
            console.log(`✅ PASS: ${desc}`);
            passed++;
        }
    }
    
    console.log("Running Location Validation Tests...\n");
    
    // Pune is accepted (Predefined)
    assertSuccess('Pune', 'Pune is accepted');
    
    // Nashik is accepted (Dynamic JSON)
    const nashikJson = JSON.stringify({ name: 'Nashik', country: 'India', lat: 19.9975, lon: 73.7898 });
    assertSuccess(nashikJson, 'Nashik is accepted');
    
    // An Indian district is accepted
    const districtJson = JSON.stringify({ name: 'Thane', country: 'India', lat: 19.2183, lon: 72.9781, type: 'ADM2' });
    assertSuccess(districtJson, 'An Indian district is accepted');
    
    // An Indian state is accepted
    const stateJson = JSON.stringify({ name: 'Maharashtra', country: 'India', lat: 19.7515, lon: 75.7139, type: 'ADM1' });
    assertSuccess(stateJson, 'An Indian state is accepted');
    
    // London is rejected
    const londonJson = JSON.stringify({ name: 'London', country: 'United Kingdom', lat: 51.5072, lon: -0.1276 });
    assertThrows(londonJson, 'London is rejected');
    
    // New York is rejected
    const nyJson = JSON.stringify({ name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 });
    assertThrows(nyJson, 'New York is rejected');
    
    // Kathmandu is rejected
    const ktmJson = JSON.stringify({ name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lon: 85.3240 });
    assertThrows(ktmJson, 'Kathmandu is rejected');
    
    // Unknown locations are rejected
    assertThrows('UnknownCity123', 'Unknown locations are rejected');
    
    // Manually supplied non-Indian coordinates cannot bypass validation
    // Try fabricating "country": "India" with NY coordinates
    const fakeNyJson = JSON.stringify({ name: 'FakeNY', country: 'India', lat: 40.7128, lon: -74.0060 });
    assertThrows(fakeNyJson, 'Manually supplied non-Indian coordinates cannot bypass validation');
    
    // Raw coordinates without country metadata are rejected
    assertThrows('40.7128, -74.0060', 'Raw coordinates without metadata are rejected');
    
    // Existing Indian predefined-location compatibility still works
    assertSuccess('mumbai', 'Existing Indian predefined-location compatibility still works');
    
    // Dynamic Indian LocationSearch continues working
    // (Simulated by valid JSON inputs like Bhopal with country_code="IN")
    assertSuccess(JSON.stringify({ name: 'Bhopal', country_code: 'IN', lat: 23.2599, lon: 77.4126 }), 'Dynamic Indian LocationSearch continues working');

    console.log(`\n================================`);
    console.log(`TOTAL PASSED: ${passed}`);
    console.log(`TOTAL FAILED: ${failed}`);
    console.log(`================================`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
