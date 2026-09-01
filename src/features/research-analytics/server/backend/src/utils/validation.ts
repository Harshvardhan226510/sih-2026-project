import { WeatherMetric, AggregationPeriod, LocationCoordinates } from '../types/analytics.js';

export const INDIAN_LOCATIONS: Record<string, LocationCoordinates> = {
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

export const VALID_METRICS: WeatherMetric[] = [
  'rainfall',
  'temperature',
  'temp_max',
  'temp_min',
  'humidity',
  'wind_speed',
  'pressure',
  'cloud_cover'
];

export const VALID_AGGREGATIONS: AggregationPeriod[] = [
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly'
];

export function resolveLocation(locationInput?: string): LocationCoordinates {
  if (!locationInput || typeof locationInput !== 'string') {
    return INDIAN_LOCATIONS.pune;
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
      return {
        name: `Coord (${parts[0].toFixed(2)}, ${parts[1].toFixed(2)})`,
        state: 'Custom Region',
        country: 'India',
        lat: parts[0],
        lon: parts[1]
      };
    }
  }

  // Default fallback
  return {
    name: locationInput.charAt(0).toUpperCase() + locationInput.slice(1),
    state: 'India',
    country: 'India',
    lat: 18.5204,
    lon: 73.8567
  };
}

export function validateDateRange(startDate?: string, endDate?: string): { start: string; end: string } {
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

export function validateMetric(metricInput?: string): WeatherMetric {
  if (!metricInput) return 'rainfall';
  const cleaned = metricInput.toLowerCase().trim() as WeatherMetric;
  if (VALID_METRICS.includes(cleaned)) return cleaned;
  if (cleaned.includes('rain') || cleaned.includes('precip')) return 'rainfall';
  if (cleaned.includes('temp')) return 'temperature';
  if (cleaned.includes('humid')) return 'humidity';
  if (cleaned.includes('wind')) return 'wind_speed';
  if (cleaned.includes('press')) return 'pressure';
  return 'rainfall';
}

export function validateAggregation(aggInput?: string): AggregationPeriod {
  if (!aggInput) return 'monthly';
  const cleaned = aggInput.toLowerCase().trim() as AggregationPeriod;
  if (VALID_AGGREGATIONS.includes(cleaned)) return cleaned;
  return 'monthly';
}
