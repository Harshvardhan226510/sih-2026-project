const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

export const config = {
  port: Number(process.env.PORT || 3001),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  weatherUrl: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1',
  geocodingUrl: process.env.OPEN_METEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1',
  weatherCacheMinutes: Number(process.env.WEATHER_CACHE_MINUTES || 60),
  demoMode: process.env.DEMO_MODE === 'true'
};

export function missingServerConfig() {
  return required.filter((key) => !process.env[key]);
}
