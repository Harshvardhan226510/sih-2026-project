export const INDIAN_LOCATIONS = {
    pune: { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567, elevation: 560 },
    mumbai: { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777, elevation: 14 },
    delhi: { name: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, elevation: 216 },
    bengaluru: { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, elevation: 920 },
    bangalore: { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, elevation: 920 },
    chennai: { name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707, elevation: 6 },
    kolkata: { name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639, elevation: 9 },
    hyderabad: { name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lon: 78.4867, elevation: 542 },
    ahmedabad: { name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714, elevation: 53 },
    jaipur: { name: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873, elevation: 431 },
    nagpur: { name: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.1458, lon: 79.0882, elevation: 310 },
    bhubaneswar: { name: 'Bhubaneswar', state: 'Odisha', country: 'India', lat: 20.2961, lon: 85.8245, elevation: 45 },
    kochi: { name: 'Kochi', state: 'Kerala', country: 'India', lat: 9.9312, lon: 76.2673, elevation: 3 },
    guwahati: { name: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1445, lon: 91.7362, elevation: 55 },
    shimla: { name: 'Shimla', state: 'Himachal Pradesh', country: 'India', lat: 31.1048, lon: 77.1734, elevation: 2276 },
};
export const VALID_METRICS = [
    'rainfall',
    'temperature',
    'temp_max',
    'temp_min',
    'humidity',
    'wind_speed',
    'pressure',
    'cloud_cover'
];
export const VALID_AGGREGATIONS = [
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly'
];
export function resolveLocation(locationInput) {
    if (!locationInput || typeof locationInput !== 'string') {
        throw new Error("Validation Error: Location is required and must be within India.");
    }

    // Try parsing as JSON first (from new frontend LocationSearch)
    try {
        const parsed = JSON.parse(locationInput);
        if (parsed && typeof parsed === 'object' && 'lat' in parsed && 'lon' in parsed) {
            const lat = Number(parsed.lat);
            const lon = Number(parsed.lon);
            const country = (parsed.country || parsed.country_code || '').toLowerCase();
            
            // Primary validation: Geocoder country metadata
            if (country !== 'india' && country !== 'in') {
                throw new Error("Validation Error: Only locations within India are supported.");
            }
            
            // Secondary validation: Prevent fabricated country payloads for foreign coordinates
            if (lat < 6.0 || lat > 36.0 || lon < 68.0 || lon > 98.0) {
                 throw new Error("Validation Error: Coordinates do not match the geographic region of India.");
            }
            
            if (Number.isFinite(lat) && Number.isFinite(lon) && 
                lat >= -90 && lat <= 90 && 
                lon >= -180 && lon <= 180) {
                return {
                    name: parsed.name || `Coord (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
                    state: parsed.state || 'Unknown Region',
                    country: parsed.country || 'India',
                    lat: lat,
                    lon: lon
                };
            }
        }
    } catch (e) {
        if (e.message.includes('Validation Error')) throw e;
        // Not a JSON string, fallback to legacy processing
    }

    const cleaned = locationInput.toLowerCase().trim();
    // Check direct predefined dictionary match
    if (INDIAN_LOCATIONS[cleaned]) {
        return INDIAN_LOCATIONS[cleaned];
    }
    // Check substring match
    for (const [key, loc] of Object.entries(INDIAN_LOCATIONS)) {
        if (cleaned.includes(key) || key.includes(cleaned)) {
            return loc;
        }
    }
    // Check if coordinates format: "18.52,73.85"
    if (cleaned.includes(',')) {
        const parts = cleaned.split(',').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            throw new Error("Validation Error: Raw coordinates without country metadata are not permitted.");
        }
    }
    // Default fallback
    throw new Error(`Validation Error: Unknown or unsupported location '${locationInput}'. Only locations in India are supported.`);
}
export function validateDateRange(startDate, endDate) {
    const defaultEnd = new Date().toISOString().split('T')[0];
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const defaultStart = tenYearsAgo.toISOString().split('T')[0];
    let start = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : defaultStart;
    let end = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : defaultEnd;
    if (start > end) {
        const temp = start;
        start = end;
        end = temp;
    }
    return { start, end };
}
export function validateMetric(metricInput) {
    if (!metricInput)
        return 'rainfall';
    const cleaned = metricInput.toLowerCase().trim();
    if (VALID_METRICS.includes(cleaned))
        return cleaned;
    if (cleaned.includes('rain') || cleaned.includes('precip'))
        return 'rainfall';
    if (cleaned.includes('temp'))
        return 'temperature';
    if (cleaned.includes('humid'))
        return 'humidity';
    if (cleaned.includes('wind'))
        return 'wind_speed';
    if (cleaned.includes('press'))
        return 'pressure';
    return 'rainfall';
}
export function validateAggregation(aggInput) {
    if (!aggInput)
        return 'monthly';
    const cleaned = aggInput.toLowerCase().trim();
    if (VALID_AGGREGATIONS.includes(cleaned))
        return cleaned;
    return 'monthly';
}
