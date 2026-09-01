import React from 'react';
import { useWeather, calculateDistanceKm } from '../../../context/WeatherContext';
import { 
  ShieldAlert, AlertTriangle, Waves, Zap, Flame, 
  CloudRain, ChevronRight, MapPin, Radio, Compass,
  PhoneCall, Clock, CheckCircle2, ChevronLeft, Building2
} from 'lucide-react';

export const AlertListPanel = ({ onSelectAlert }) => {
  const { 
    activeAlerts, 
    setSelectedLocation, 
    selectedAlertForDetail,
    setSelectedAlertForDetail,
    alertFilterCategory, 
    setAlertFilterCategory,
    userLiveLocation 
  } = useWeather();

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'RED':
        return {
          bg: '#dc2626',
          pillBg: 'rgba(220, 38, 38, 0.2)',
          color: '#fca5a5',
          border: 'rgba(239, 68, 68, 0.5)',
          dot: '#dc2626',
          label: 'CRITICAL DANGER'
        };
      case 'ORANGE':
        return {
          bg: '#ea580c',
          pillBg: 'rgba(234, 88, 12, 0.2)',
          color: '#fdba74',
          border: 'rgba(249, 115, 22, 0.5)',
          dot: '#ea580c',
          label: 'HIGH WARNING'
        };
      case 'YELLOW':
      default:
        return {
          bg: '#ca8a04',
          pillBg: 'rgba(202, 138, 4, 0.2)',
          color: '#fef08a',
          border: 'rgba(234, 179, 8, 0.5)',
          dot: '#ca8a04',
          label: 'ADVISORY'
        };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'flood':
        return <Waves size={14} className="text-blue-400" />;
      case 'heavy-rain':
      case 'rain':
        return <CloudRain size={14} className="text-cyan-400" />;
      case 'thunderstorm':
        return <Zap size={14} className="text-amber-400" />;
      case 'heatwave':
        return <Flame size={14} className="text-rose-400" />;
      default:
        return <AlertTriangle size={14} className="text-orange-400" />;
    }
  };

  // Filter alerts
  const filteredAlerts = activeAlerts.filter((alert) => {
    if (alertFilterCategory === 'all') return true;
    if (alertFilterCategory === 'RED') return alert.severity === 'RED';
    if (alertFilterCategory === 'ORANGE') return alert.severity === 'ORANGE';
    if (alertFilterCategory === 'YELLOW') return alert.severity === 'YELLOW';
    if (alertFilterCategory === 'near-me' && userLiveLocation) {
      const dist = calculateDistanceKm(userLiveLocation.lat, userLiveLocation.lon, alert.lat, alert.lon);
      return dist !== null && dist <= 250;
    }
    return alert.category === alertFilterCategory;
  });

  const handleSelectAlert = (alert) => {
    setSelectedAlertForDetail(alert);
    if (alert.lat && alert.lon) {
      setSelectedLocation({
        lat: alert.lat,
        lon: alert.lon,
        name: alert.title,
        region: alert.region,
        country: 'India'
      });
    }
    if (onSelectAlert) {
      onSelectAlert(alert);
    }
  };

  const criticalCount = activeAlerts.filter(a => a.severity === 'RED').length;
  const orangeCount = activeAlerts.filter(a => a.severity === 'ORANGE').length;

  return (
    <div className="gmaps-alert-feed-container">
      {/* Quick Filter Pill Chips */}
      <div className="alert-filter-chips-scroll">
        <button
          className={`filter-chip ${alertFilterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setAlertFilterCategory('all')}
        >
          All ({activeAlerts.length})
        </button>

        <button
          className={`filter-chip critical ${alertFilterCategory === 'RED' ? 'active' : ''}`}
          onClick={() => setAlertFilterCategory('RED')}
        >
          🔴 Critical ({criticalCount})
        </button>

        <button
          className={`filter-chip orange ${alertFilterCategory === 'ORANGE' ? 'active' : ''}`}
          onClick={() => setAlertFilterCategory('ORANGE')}
        >
          🟠 Warning ({orangeCount})
        </button>

        <button
          className={`filter-chip ${alertFilterCategory === 'flood' ? 'active' : ''}`}
          onClick={() => setAlertFilterCategory('flood')}
        >
          🌊 Floods
        </button>

        <button
          className={`filter-chip ${alertFilterCategory === 'thunderstorm' ? 'active' : ''}`}
          onClick={() => setAlertFilterCategory('thunderstorm')}
        >
          ⚡ Storms
        </button>

        <button
          className={`filter-chip ${alertFilterCategory === 'heatwave' ? 'active' : ''}`}
          onClick={() => setAlertFilterCategory('heatwave')}
        >
          🔥 Heatwave
        </button>

        {userLiveLocation && (
          <button
            className={`filter-chip near-me ${alertFilterCategory === 'near-me' ? 'active' : ''}`}
            onClick={() => setAlertFilterCategory('near-me')}
          >
            📍 Near Me
          </button>
        )}
      </div>

      {/* Alert Feed Cards */}
      <div className="gmaps-alert-cards-scroll">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts-empty-state">
            <CheckCircle2 size={36} className="text-emerald-400 mb-3" />
            <span className="text-base font-bold text-slate-100">No active alerts in this category</span>
            <p className="text-xs text-slate-400 mt-1">Weather conditions are currently normal for this filter.</p>
            <button className="reset-filter-btn" onClick={() => setAlertFilterCategory('all')}>
              Show All Active Alerts
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            const dist = userLiveLocation && alert.lat && alert.lon
              ? calculateDistanceKm(userLiveLocation.lat, userLiveLocation.lon, alert.lat, alert.lon)
              : null;
            const isSelected = selectedAlertForDetail?.id === alert.id;

            return (
              <div
                key={alert.id}
                className={`gmaps-alert-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectAlert(alert)}
              >
                {/* Left Severity Color Strip */}
                <div 
                  className="severity-color-strip" 
                  style={{ backgroundColor: badge.bg }} 
                />

                <div className="alert-card-inner">
                  {/* Top Line: Badge, Category, Distance */}
                  <div className="alert-card-top-tags">
                    <span 
                      className="severity-pill"
                      style={{ 
                        backgroundColor: badge.pillBg, 
                        color: badge.color, 
                        borderColor: badge.border 
                      }}
                    >
                      <span className="severity-dot-pulse" style={{ backgroundColor: badge.bg }}></span>
                      {badge.label}
                    </span>

                    <span className="category-pill">
                      {getCategoryIcon(alert.category)}
                      <span>{alert.categoryLabel || alert.category}</span>
                    </span>

                    {dist !== null && (
                      <span className="distance-badge">
                        📍 {dist} km away
                      </span>
                    )}
                  </div>

                  {/* Alert Title */}
                  <h4 className="gmaps-alert-title">{alert.title}</h4>

                  {/* Region */}
                  <div className="gmaps-alert-region-row">
                    <MapPin size={13} className="text-sky-400 shrink-0" />
                    <span className="region-text">{alert.region}</span>
                  </div>

                  {/* Plain Language Summary */}
                  <p className="gmaps-alert-summary">
                    {alert.simpleSummary || alert.description}
                  </p>

                  {/* Card Bottom: Validity & Issuer & Action Hint */}
                  <div className="alert-card-footer">
                    <div className="flex items-center gap-2">
                      <span className="validity-text">
                        <Clock size={12} className="text-amber-400" /> {alert.timestamp || 'Active'}
                      </span>
                      <span className="issuer-text truncate max-w-[130px]" title={alert.issuer}>
                        {alert.issuer}
                      </span>
                    </div>

                    <span className="view-details-action">
                      View Safety Guide <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertListPanel;
