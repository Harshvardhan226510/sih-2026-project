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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Quick Filter Pill Chips */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-2 shrink-0 scrollbar-hide">
        <button
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${alertFilterCategory === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          onClick={() => setAlertFilterCategory('all')}
        >
          All ({activeAlerts.length})
        </button>

        <button
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center ${alertFilterCategory === 'RED' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
          onClick={() => setAlertFilterCategory('RED')}
        >
          <span className="w-2 h-2 rounded-full bg-current mr-1.5 opacity-80"></span> Critical ({criticalCount})
        </button>

        <button
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center ${alertFilterCategory === 'ORANGE' ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}
          onClick={() => setAlertFilterCategory('ORANGE')}
        >
          <span className="w-2 h-2 rounded-full bg-current mr-1.5 opacity-80"></span> Warning ({orangeCount})
        </button>

        <button
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center ${alertFilterCategory === 'flood' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
          onClick={() => setAlertFilterCategory('flood')}
        >
          <Waves size={12} className="mr-1.5" /> Floods
        </button>

        <button
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center ${alertFilterCategory === 'thunderstorm' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
          onClick={() => setAlertFilterCategory('thunderstorm')}
        >
          <Zap size={12} className="mr-1.5" /> Storms
        </button>

        <button
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center ${alertFilterCategory === 'heatwave' ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
          onClick={() => setAlertFilterCategory('heatwave')}
        >
          <Flame size={12} className="mr-1.5" /> Heatwave
        </button>

        {userLiveLocation && (
          <button
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center ${alertFilterCategory === 'near-me' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
            onClick={() => setAlertFilterCategory('near-me')}
          >
            <MapPin size={12} className="mr-1.5" /> Near Me
          </button>
        )}
      </div>

      {/* Alert Feed Cards */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 h-48">
            <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
            <span className="text-base font-bold text-slate-800">No active alerts in this category</span>
            <p className="text-xs text-slate-500 mt-1 mb-4">Weather conditions are currently normal for this filter.</p>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => setAlertFilterCategory('all')}>
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
                className={`relative bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex ${isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                onClick={() => handleSelectAlert(alert)}
              >
                {/* Left Severity Color Strip */}
                <div 
                  className="w-1.5 shrink-0 h-full" 
                  style={{ backgroundColor: badge.bg }} 
                />

                <div className="p-4 flex-1">
                  {/* Top Line: Badge, Category, Distance */}
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{ 
                        backgroundColor: badge.pillBg, 
                        color: badge.dot, 
                        border: `1px solid ${badge.border}` 
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: badge.dot }}></span>
                      {badge.label}
                    </span>

                    <span className="inline-flex items-center text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      <span className="mr-1">{getCategoryIcon(alert.category)}</span>
                      <span>{alert.categoryLabel || alert.category}</span>
                    </span>

                    {dist !== null && (
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 ml-auto">
                        📍 {dist} km away
                      </span>
                    )}
                  </div>

                  {/* Alert Title */}
                  <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">{alert.title}</h4>

                  {/* Region */}
                  <div className="flex items-center text-xs text-slate-600 mb-2">
                    <MapPin size={12} className="text-blue-500 shrink-0 mr-1" />
                    <span className="truncate">{alert.region}</span>
                  </div>

                  {/* Plain Language Summary */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {alert.simpleSummary || alert.description}
                  </p>

                  {/* Card Bottom: Validity & Issuer & Action Hint */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-[10px] font-mono text-slate-500">
                        <Clock size={10} className="text-slate-400 mr-1" /> {alert.timestamp || 'Active'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]" title={alert.issuer}>
                        {alert.issuer}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-blue-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                      View Details <ChevronRight size={12} className="ml-0.5" />
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
