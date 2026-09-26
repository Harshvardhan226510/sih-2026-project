import React from 'react';
import { Icon } from './Icon';

export function Sidebar({ data, activeCrop, setActiveCrop, setSearch, decisionState }) {
  if (!data || !data.current) return null;

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Current Conditions Card */}
      <article className="current-weather-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Current Conditions</h3>
          <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }} onClick={() => setSearch(true)}>
            Change Location
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a' }}>
            {data.current.temperature}°C
          </div>
          <div style={{ fontSize: '16px', color: '#475569' }}>
            {data.forecast[0]?.icon} {data.forecast[0]?.rainProbability > 50 ? 'Rain Expected' : 'Partly Cloudy'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Wind</span>
            <strong>{data.current.windSpeed} km/h</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Rain Prob</span>
            <strong>{data.forecast[0]?.rainProbability}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Humidity</span>
            <strong>{data.current.humidity}%</strong>
          </div>
        </div>
      </article>

      {/* My Crops */}
      <article className="crops-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>My Crop</h3>
        
        {data.crops?.map((x, i) => {
          const isActive = activeCrop?.name === x.name;
          if (!isActive) {
            return (
              <button
                key={`${x.name}-${i}`}
                onClick={() => setActiveCrop(x)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px',
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px',
                  cursor: 'pointer'
                }}
              >
                Switch to {x.name}
              </button>
            );
          }

          return (
            <div key={`${x.name}-${i}`} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#0369a1' }}>{x.name}</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#0284c7' }}>{x.stage}</p>
                </div>
                <Icon>{x.icon}</Icon>
              </div>

              <div style={{ fontSize: '13px', color: '#334155', display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Sown</span>
                  <strong>{x.sowingDate ? new Date(x.sowingDate).toLocaleDateString() : 'Not recorded'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Weather Impact</span>
                  <strong style={{ color: decisionState?.primary?.severity === 'HIGH' ? '#dc2626' : '#16a34a' }}>
                    {decisionState?.primary?.severity === 'HIGH' ? 'High' : decisionState?.primary?.severity === 'MODERATE' ? 'Moderate' : 'Low'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Today's Focus</span>
                  <strong>{decisionState?.primary?.status || 'Monitor'}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </article>
      
    </aside>
  );
}
