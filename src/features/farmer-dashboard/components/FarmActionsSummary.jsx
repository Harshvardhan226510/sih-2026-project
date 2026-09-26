import React from 'react';

export function FarmActionsSummary({ decisionState, language }) {
  if (!decisionState || !decisionState.actions) return null;

  const isHi = language === 'hi';
  const isMr = language === 'mr';

  const actionsTitle = isHi ? 'आज के कृषि कार्य' : isMr ? 'आजची कृषी कामे' : 'Today\'s Farm Actions';
  const summaryTitle = isHi ? 'खेत स्वास्थ्य सारांश' : isMr ? 'शेत आरोग्य सारांश' : 'Farm Health Summary';

  const actions = Object.entries(decisionState.actions).filter(([_, val]) => val !== null);
  
  // Filter out "NOT APPLICABLE" from the visual summary to reduce noise
  const summaryItems = actions.filter(([_, val]) => val.status !== 'NOT APPLICABLE');

  // Filter out 'NORMAL' and 'NOT APPLICABLE' for the specific action list to keep it focused
  const urgentActions = actions.filter(([_, val]) => val.severity !== 'LOW' && val.status !== 'NOT APPLICABLE');

  return (
    <div className="farm-actions-summary" style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
      <section className="farm-summary" style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', textTransform: 'uppercase' }}>{summaryTitle}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {summaryItems.map(([key, a]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <div key={key} style={{ 
                display: 'flex', flexDirection: 'column', padding: '12px', background: '#fff', 
                borderRadius: '8px', 
                borderLeft: `4px solid ${a.severity === 'HIGH' ? '#dc2626' : a.severity === 'MODERATE' ? '#d97706' : '#16a34a'}`,
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontSize: '14px', color: '#0f172a', marginTop: '4px', fontWeight: '500' }}>
                  {a.severity === 'HIGH' ? 'High Risk' : a.severity === 'MODERATE' ? 'Monitor' : 'Normal'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="farm-actions" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', textTransform: 'uppercase' }}>{actionsTitle}</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {urgentActions.length === 0 ? (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>
              Nothing urgent based on current weather.
            </div>
          ) : (
            urgentActions.map(([key, a]) => (
              <div key={key} style={{ 
                padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{key}</strong>
                  <span style={{ 
                    fontSize: '12px', 
                    color: a.severity === 'HIGH' ? '#dc2626' : '#d97706', 
                    fontWeight: 'bold',
                    background: a.severity === 'HIGH' ? '#fef2f2' : '#fffbeb',
                    padding: '4px 8px',
                    borderRadius: '999px'
                  }}>
                    {a.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155' }}>
                  {a.reason}
                </p>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px' }}>
                  <span><em>Evidence:</em> {a.evidence}</span>
                  {a.timing && <span><em>Timing:</em> {a.timing}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
