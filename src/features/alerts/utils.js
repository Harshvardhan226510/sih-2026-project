export const SEVERITY_CONFIG = {
  Extreme: { 
    color: '#ef4444', 
    bg: 'rgba(239, 68, 68, 0.12)', 
    border: 'rgba(239, 68, 68, 0.35)', 
    badgeBg: 'rgba(239, 68, 68, 0.9)', 
    icon: '▲', 
    label: 'EXTREME', 
    priority: 0 
  },
  Severe: { 
    color: '#f97316', 
    bg: 'rgba(249, 115, 22, 0.12)', 
    border: 'rgba(249, 115, 22, 0.35)', 
    badgeBg: 'rgba(249, 115, 22, 0.9)', 
    icon: '◆', 
    label: 'SEVERE', 
    priority: 1 
  },
  Moderate: { 
    color: '#eab308', 
    bg: 'rgba(234, 179, 8, 0.12)', 
    border: 'rgba(234, 179, 8, 0.35)', 
    badgeBg: 'rgba(234, 179, 8, 0.9)', 
    icon: '●', 
    label: 'MODERATE', 
    priority: 2 
  },
  Minor: { 
    color: '#38bdf8', 
    bg: 'rgba(56, 189, 248, 0.12)', 
    border: 'rgba(56, 189, 248, 0.35)', 
    badgeBg: 'rgba(56, 189, 248, 0.9)', 
    icon: 'ℹ', 
    label: 'MINOR', 
    priority: 3 
  },
  Unknown: { 
    color: '#94a3b8', 
    bg: 'rgba(148, 163, 184, 0.12)', 
    border: 'rgba(148, 163, 184, 0.35)', 
    badgeBg: 'rgba(148, 163, 184, 0.9)', 
    icon: '—', 
    label: 'UNKNOWN', 
    priority: 4 
  },
};

export function getSeverityConfig(severity) {
  if (!severity) return SEVERITY_CONFIG.Unknown;
  const key = Object.keys(SEVERITY_CONFIG).find(k => k.toLowerCase() === severity.toLowerCase());
  return key ? SEVERITY_CONFIG[key] : SEVERITY_CONFIG.Unknown;
}

export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Curated high-resolution atmospheric weather imagery
 */
export function getWeatherImageForEvent(event) {
  const e = (event || '').toLowerCase();
  
  if (e.includes('rain') || e.includes('shower') || e.includes('monsoon')) {
    return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('thunder') || e.includes('lightning')) {
    return 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('heat') || e.includes('temperature') || e.includes('warm')) {
    return 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('flood') || e.includes('inundation') || e.includes('water')) {
    return 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('fog') || e.includes('mist') || e.includes('dense fog')) {
    return 'https://images.unsplash.com/photo-1487621167305-5d248087c724?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('cyclone') || e.includes('storm') || e.includes('depression') || e.includes('gale')) {
    return 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('wind') || e.includes('squall')) {
    return 'https://images.unsplash.com/photo-1505672678556-3a789ef23395?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('hail') || e.includes('snow') || e.includes('cold') || e.includes('frost')) {
    return 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1200&q=85&auto=format&fit=crop';
  }
  if (e.includes('dust') || e.includes('sand')) {
    return 'https://images.unsplash.com/photo-1545042679-41d22b2ca130?w=1200&q=85&auto=format&fit=crop';
  }
  
  // Default atmospheric clouds
  return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&q=85&auto=format&fit=crop';
}