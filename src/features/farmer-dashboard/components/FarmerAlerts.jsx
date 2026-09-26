import React, { useEffect, useState } from 'react';
import { fetchAlerts } from '../../alerts/services/alertApi';

export function FarmerAlerts({ place, language }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    if (!place || !place.name) return;
    
    let district = '';
    let state = '';
    const parts = place.name.split(',').map(s => s.trim());
    if (parts.length > 0) district = parts[0];
    if (parts.length > 1) state = parts[1];

    async function loadAlerts() {
      try {
        setLoading(true);
        setErrorState(null);
        
        // Try passing full coordinates + state/district
        const params = { 
          lat: place.latitude, 
          lon: place.longitude,
          district: district,
          state: state
        };
        
        const data = await fetchAlerts(params);
        
        if (data && data.alerts) {
          // Client-side geographic filtering to guarantee strict relevance
          const relevant = data.alerts.filter(a => {
            const areaDesc = (a.areaDesc || '').toLowerCase();
            const dMatch = district && areaDesc.includes(district.toLowerCase());
            const sMatch = state && areaDesc.includes(state.toLowerCase());
            
            // Allow if it matches district strongly
            if (dMatch) return true;
            
            // Allow if there's polygon proximity logic from backend
            if (a.distanceKm !== undefined && a.distanceKm < 50) return true;
            
            return false;
          });
          
          setAlerts(relevant);
        } else {
          setAlerts([]);
        }
      } catch (err) {
        console.error('Failed to load alerts:', err);
        setErrorState('service_unavailable');
      } finally {
        setLoading(false);
      }
    }
    
    loadAlerts();
  }, [place]);

  const isHi = language === 'hi';
  const isMr = language === 'mr';
  const title = isHi ? 'मौसम चेतावनी' : isMr ? 'हवामान इशारा' : 'WEATHER ALERTS';

  if (loading) {
    return (
      <section style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading alerts...</div>
      </section>
    );
  }

  if (errorState === 'service_unavailable') {
    return (
      <section style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>{title}</h3>
        <div style={{ color: '#94a3b8', fontSize: '14px' }}>Alert service is temporarily unavailable.</div>
      </section>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <section style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>{title}</h3>
        <div style={{ color: '#16a34a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✓</span> No active weather alerts for your selected location.
        </div>
      </section>
    );
  }

  // Only show top 3 highest priority alerts
  const topAlerts = alerts.slice(0, 3);

  return (
    <section className="farmer-alerts" style={{ marginTop: '20px', padding: '24px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fca5a5' }}>
      <h3 style={{ color: '#dc2626', margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px' }}>⚠️</span> {title}
      </h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        {topAlerts.map(alert => (
          <div key={alert.id || Math.random()} style={{ background: '#fff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {alert.source || 'IMD'} • {alert.severity || 'Warning'}
              </div>
              {alert.expires && (
                <div style={{ fontSize: '12px', color: '#dc2626' }}>
                  Valid until {new Date(alert.expires).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              )}
            </div>
            
            <strong style={{ display: 'block', marginBottom: '6px', color: '#0f172a', fontSize: '16px' }}>
              {alert.event || alert.title}
            </strong>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155' }}>
              {alert.description || alert.headline}
            </p>
            
            {alert.areaDesc && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                📍 {alert.areaDesc}
              </div>
            )}
          </div>
        ))}
        {alerts.length > 3 && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: '500', cursor: 'pointer' }}>
              View {alerts.length - 3} more alerts
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
