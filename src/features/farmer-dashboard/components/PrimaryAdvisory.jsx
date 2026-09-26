import React from 'react';

export function PrimaryAdvisory({ decisionState, place, data, language }) {
  if (!decisionState || !decisionState.primary) return null;
  const primary = decisionState.primary;
  
  const isHi = language === 'hi';
  const isMr = language === 'mr';

  const titleText = isHi ? 'आज का कृषि निर्णय' : isMr ? 'आजचा शेती निर्णय' : 'FARM TODAY';
  
  // Icon based on severity
  const icon = primary.severity === 'HIGH' ? '⚠️' : primary.severity === 'MODERATE' ? '👀' : '✅';
  const color = primary.severity === 'HIGH' ? '#dc2626' : primary.severity === 'MODERATE' ? '#d97706' : '#16a34a';
  const bg = primary.severity === 'HIGH' ? '#fef2f2' : primary.severity === 'MODERATE' ? '#fffbeb' : '#f0fdf4';
  const border = primary.severity === 'HIGH' ? '#fca5a5' : primary.severity === 'MODERATE' ? '#fcd34d' : '#86efac';

  return (
    <section className="primary-decision" style={{ 
      background: '#fff', 
      borderRadius: '12px', 
      padding: '24px', 
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.05em' }}>
          {titleText}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          {place?.name} • Updated {new Date(data?.syncedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      <div style={{ 
        background: bg, 
        border: `1px solid ${border}`, 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '16px'
      }}>
        <h2 style={{ color, margin: '0 0 12px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{icon}</span> {primary.status}
        </h2>
        
        <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '500', margin: '0 0 16px 0' }}>
          {primary.reason}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
          <div>
            <div style={{ color: '#64748b', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase' }}>Evidence</div>
            <div style={{ color: '#334155' }}>{primary.evidence}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase' }}>Confidence</div>
            <div style={{ color: '#334155', fontWeight: '500' }}>{primary.confidence}</div>
          </div>
        </div>

        {primary.timing && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px dashed ${border}` }}>
            <div style={{ color: '#64748b', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase' }}>Potentially better period</div>
            <div style={{ color: '#0f172a', fontWeight: 'bold' }}>{primary.timing}</div>
          </div>
        )}
      </div>
    </section>
  );
}
