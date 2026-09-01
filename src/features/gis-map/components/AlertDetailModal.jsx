import React from 'react';
import { useWeather, calculateDistanceKm } from '../../../context/WeatherContext';
import { 
  X, ShieldAlert, AlertTriangle, Waves, Zap, Flame, 
  CloudRain, PhoneCall, CheckCircle2, XCircle, Bot, 
  MapPin, Clock, Users, Building2, ExternalLink
} from 'lucide-react';

export const AlertDetailModal = ({ onNavigateToChatbot }) => {
  const { 
    selectedAlertForDetail, 
    setSelectedAlertForDetail, 
    userLiveLocation, 
    setSelectedLocation,
    setCroppedSpatialContext
  } = useWeather();

  if (!selectedAlertForDetail) return null;

  const alert = selectedAlertForDetail;
  const distance = userLiveLocation && alert.lat && alert.lon
    ? calculateDistanceKm(userLiveLocation.lat, userLiveLocation.lon, alert.lat, alert.lon)
    : null;

  const getSeverityTheme = (severity) => {
    switch (severity) {
      case 'RED':
        return {
          bg: '#dc2626',
          badgeBg: 'rgba(220, 38, 38, 0.15)',
          badgeText: '#f87171',
          border: 'rgba(220, 38, 38, 0.4)',
          glow: 'rgba(220, 38, 38, 0.3)',
          label: 'CRITICAL EMERGENCY (RED ALERT)'
        };
      case 'ORANGE':
        return {
          bg: '#ea580c',
          badgeBg: 'rgba(234, 88, 12, 0.15)',
          badgeText: '#fb923c',
          border: 'rgba(234, 88, 12, 0.4)',
          glow: 'rgba(234, 88, 12, 0.3)',
          label: 'HIGH WARNING (ORANGE ALERT)'
        };
      case 'YELLOW':
      default:
        return {
          bg: '#ca8a04',
          badgeBg: 'rgba(202, 138, 4, 0.15)',
          badgeText: '#facc15',
          border: 'rgba(202, 138, 4, 0.4)',
          glow: 'rgba(202, 138, 4, 0.3)',
          label: 'WEATHER ADVISORY (YELLOW ALERT)'
        };
    }
  };

  const theme = getSeverityTheme(alert.severity);

  const handleAskAI = () => {
    // Attach spatial context to chatbot
    setCroppedSpatialContext({
      center: { lat: alert.lat, lon: alert.lon },
      bounds: null,
      zoom: 9,
      activeLayers: ['SACHET Alerts', alert.categoryLabel || alert.category],
      alertsCount: 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      alertContext: {
        title: alert.title,
        severity: alert.severity,
        region: alert.region,
        description: alert.description
      }
    });

    setSelectedAlertForDetail(null);
    if (onNavigateToChatbot) {
      onNavigateToChatbot();
    }
  };

  const handleCenterOnMap = () => {
    setSelectedLocation({
      lat: alert.lat,
      lon: alert.lon,
      name: alert.title,
      region: alert.region,
      country: 'India'
    });
  };

  return (
    <div className="alert-detail-backdrop animate__animated animate__fadeIn">
      <div 
        className="alert-detail-card animate__animated animate__zoomIn"
        style={{ borderColor: theme.border, boxShadow: `0 20px 50px rgba(0,0,0,0.7), 0 0 30px ${theme.glow}` }}
      >
        {/* Header Bar */}
        <div className="alert-detail-header" style={{ borderBottomColor: theme.border }}>
          <div className="flex items-center gap-3">
            <div className="alert-badge-icon-wrap" style={{ background: theme.badgeBg, borderColor: theme.border }}>
              <ShieldAlert size={22} style={{ color: theme.badgeText }} />
            </div>
            <div>
              <span className="alert-severity-pill" style={{ background: theme.badgeBg, color: theme.badgeText, borderColor: theme.border }}>
                {theme.label}
              </span>
              <h2 className="alert-modal-title">{alert.title}</h2>
            </div>
          </div>
          <button 
            className="alert-modal-close-btn"
            onClick={() => setSelectedAlertForDetail(null)}
            title="Close Alert Details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="alert-detail-body">
          {/* Metadata Row */}
          <div className="alert-meta-grid">
            <div className="alert-meta-item">
              <MapPin size={15} className="text-cyan-400" />
              <div>
                <span className="meta-label">Location / Region</span>
                <strong className="meta-val">{alert.region}</strong>
              </div>
            </div>

            {distance !== null && (
              <div className="alert-meta-item">
                <span className="distance-ping-dot"></span>
                <div>
                  <span className="meta-label">Proximity To You</span>
                  <strong className="meta-val text-cyan-300">{distance} km away</strong>
                </div>
              </div>
            )}

            <div className="alert-meta-item">
              <Clock size={15} className="text-amber-400" />
              <div>
                <span className="meta-label">Validity Period</span>
                <strong className="meta-val">{alert.timestamp || alert.expiresAt}</strong>
              </div>
            </div>

            <div className="alert-meta-item">
              <Building2 size={15} className="text-emerald-400" />
              <div>
                <span className="meta-label">Issuing Authority</span>
                <strong className="meta-val">{alert.issuer}</strong>
              </div>
            </div>
          </div>

          {/* Simple Human-Friendly Summary Box */}
          <div className="human-summary-box" style={{ background: theme.badgeBg, borderColor: theme.border }}>
            <div className="summary-title-row">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.badgeText }}>
                📢 Plain-Language Summary (What is happening)
              </span>
            </div>
            <p className="human-summary-text">
              {alert.simpleSummary || alert.description}
            </p>
            <p className="detailed-desc-text">
              <strong>Official Bulletin:</strong> {alert.description}
            </p>
          </div>

          {/* Action Guidelines: Dos & Don'ts */}
          <div className="safety-guidelines-grid">
            <div className="safety-column dos-column">
              <div className="safety-col-header text-emerald-400">
                <CheckCircle2 size={16} />
                <span>What You Should Do (Safety Steps)</span>
              </div>
              <ul className="safety-list">
                {(alert.safetyDos || [
                  'Follow advisories from local disaster management teams',
                  'Keep emergency phones charged and water reserves ready',
                  'Stay tuned to official weather radio broadcasts'
                ]).map((doItem, idx) => (
                  <li key={idx} className="safety-list-item do-item">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{doItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="safety-column donts-column">
              <div className="safety-col-header text-rose-400">
                <XCircle size={16} />
                <span>What You Should Avoid (High Risk)</span>
              </div>
              <ul className="safety-list">
                {(alert.safetyDonts || [
                  'Do NOT venture into flooded roads or unknown water depths',
                  'Do NOT touch loose wires or broken electricity infrastructure'
                ]).map((dontItem, idx) => (
                  <li key={idx} className="safety-list-item dont-item">
                    <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                    <span>{dontItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Emergency Helpline Strip */}
          <div className="emergency-helpline-strip">
            <div className="flex items-center gap-2">
              <PhoneCall size={18} className="text-rose-400 animate-pulse" />
              <div>
                <span className="text-xs text-slate-300 font-bold block">Emergency Helplines</span>
                <span className="text-xs text-slate-400">{alert.helpline || 'Disaster Control: 1070 | National SOS: 112 | Ambulance: 108'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="tel:112" className="helpline-quick-btn sos">
                Call 112 (SOS)
              </a>
              <a href="tel:1070" className="helpline-quick-btn disaster">
                Call 1070 (Disaster)
              </a>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="alert-detail-footer">
          <button className="btn-map-center" onClick={handleCenterOnMap}>
            <MapPin size={15} /> Center on Map ({alert.radiusKm || 50}km Radius)
          </button>
          
          <button className="btn-ai-consult" onClick={handleAskAI}>
            <Bot size={16} /> Ask AI Assistant About This Hazard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailModal;
