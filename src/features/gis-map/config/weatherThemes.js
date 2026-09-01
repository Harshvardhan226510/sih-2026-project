export const WEATHER_THEMES = {
  storm: {
    id: 'storm',
    name: 'Storm with Heavy Rain',
    headline: 'Storm with Heavy Rain',
    summary: 'Partly cloudy with severe thunder spells and occasional heavy showers. High around 18°C. Wind from east 15 to 25 km/h. Localized flood alerts in effect.',
    baseGradient: 'linear-gradient(135deg, #090d16 0%, #1e293b 50%, #0f172a 100%)',
    bgImage: 'https://images.unsplash.com/photo-1511289081-d06d5b37467b?q=80&w=2070&auto=format&fit=crop',
    particleType: 'lightning',
    accentColor: '#38bdf8',
    icon: 'CloudLightning'
  },
  rain: {
    id: 'rain',
    name: 'Moderate to Heavy Rain',
    headline: 'Continuous Monsoon Rain',
    summary: 'Overcast skies with steady rainfall throughout the day. High around 22°C. Wind from southwest 12 to 18 km/h. Humidity remains near 90%.',
    baseGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    bgImage: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=2070&auto=format&fit=crop',
    particleType: 'rain',
    accentColor: '#60a5fa',
    icon: 'CloudRain'
  },
  clear: {
    id: 'clear',
    name: 'Clear & Sunny',
    headline: 'Bright & Clear Skies',
    summary: 'Plentiful sunshine with light breezes. High around 29°C. UV Index peaking around 8 (Very High). Excellent visibility across the valley.',
    baseGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #f59e0b 100%)',
    bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
    particleType: 'sunrays',
    accentColor: '#fbbf24',
    icon: 'Sun'
  },
  clouds: {
    id: 'clouds',
    name: 'Partly Cloudy',
    headline: 'Partly Cloudy & Cool',
    summary: 'Scattered cloud cover with pleasant afternoon sunshine. High around 24°C. Wind from west 8 to 14 km/h.',
    baseGradient: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #0f172a 100%)',
    bgImage: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=2000&auto=format&fit=crop',
    particleType: 'none',
    accentColor: '#a7f3d0',
    icon: 'Cloud'
  },
  snow: {
    id: 'snow',
    name: 'Light Snowfall',
    headline: 'Fresh Snow & Frost',
    summary: 'Gentle snow showers continuing into the evening. High around -2°C. Cold northerly wind 10 to 20 km/h.',
    baseGradient: 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #94a3b8 100%)',
    bgImage: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?q=80&w=2070&auto=format&fit=crop',
    particleType: 'snow',
    accentColor: '#e0f2fe',
    icon: 'Snowflake'
  }
};

export const getThemeForCondition = (conditionText) => {
  if (!conditionText) return WEATHER_THEMES.storm;
  const text = conditionText.toLowerCase();
  if (text.includes('thunder') || text.includes('storm') || text.includes('lightning')) {
    return WEATHER_THEMES.storm;
  }
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) {
    return WEATHER_THEMES.rain;
  }
  if (text.includes('snow') || text.includes('ice') || text.includes('blizzard')) {
    return WEATHER_THEMES.snow;
  }
  if (text.includes('clear') || text.includes('sunny')) {
    return WEATHER_THEMES.clear;
  }
  return WEATHER_THEMES.storm;
  
};
