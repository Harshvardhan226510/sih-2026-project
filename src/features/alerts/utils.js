export const SEVERITY_CONFIG = {
  Extreme: { color: 'var(--severity-extreme)', bg: 'rgba(239, 68, 68, 0.15)', icon: '⚠', label: 'EXTREME', priority: 0 },
  Severe: { color: 'var(--severity-severe)', bg: 'rgba(249, 115, 22, 0.15)', icon: '🔶', label: 'SEVERE', priority: 1 },
  Moderate: { color: 'var(--severity-moderate)', bg: 'rgba(234, 179, 8, 0.15)', icon: '🔸', label: 'MODERATE', priority: 2 },
  Minor: { color: 'var(--severity-minor)', bg: 'rgba(59, 130, 246, 0.15)', icon: 'ℹ', label: 'MINOR', priority: 3 },
  Unknown: { color: 'var(--text-muted)', bg: 'rgba(100, 116, 139, 0.15)', icon: '?', label: 'UNKNOWN', priority: 4 },
};
export function getSeverityConfig(severity) {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Unknown;
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
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function getWeatherImageForEvent(event) {
  const e = (event || '').toLowerCase();
  
  if (e.includes('rain') || e.includes('shower')) {
    return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&q=80&auto=format&fit=crop';
  }
  if (e.includes('thunder') || e.includes('lightning')) {
    return 'https://images.unsplash.com/photo-1429552077091-836152271555?w=800&q=80&auto=format&fit=crop';
  }
  if (e.includes('heat') || e.includes('hot') || e.includes('temperature')) {
    return 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=800&q=80&auto=format&fit=crop';
  }
  if (e.includes('flood') || e.includes('water')) {
    return 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80&auto=format&fit=crop';
  }
  if (e.includes('fog') || e.includes('mist')) {
    return 'https://images.unsplash.com/photo-1487621167305-5d248087c724?w=800&q=80&auto=format&fit=crop';
  }
  if (e.includes('cyclone') || e.includes('storm') || e.includes('wind')) {
    return 'https://images.unsplash.com/photo-1495615080073-6b89c9839ce0?w=800&q=80&auto=format&fit=crop';
  }
  if (e.includes('hail') || e.includes('snow') || e.includes('cold')) {
    return 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80&auto=format&fit=crop';
  }
  if (e.includes('dust')) {
    return 'https://images.unsplash.com/photo-1545042679-41d22b2ca130?w=800&q=80&auto=format&fit=crop';
  }
  
  // Default fallback (atmospheric clouds)
  return 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80&auto=format&fit=crop';
}