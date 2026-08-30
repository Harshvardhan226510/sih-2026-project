import { useState, useEffect } from 'react';
import { getSeverityConfig, formatTime } from '../utils.js';
import { fetchAlert, fetchAlertHistory } from '../services/alertApi.js';

export function AlertDetail({ alert, onClose, networkOnline }) {
  const [full, setFull] = useState(null);
  const [history, setHistory] = useState([]);
  const [showTech, setShowTech] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  
  const data = full || alert;
  const sev = getSeverityConfig(data.severity);
  
  useEffect(() => {
    setFull(null);
    setHistory([]);
    if (networkOnline) {
      fetchAlert(alert.id).then(setFull).catch(() => {});
      if (alert.version > 1) {
        fetchAlertHistory(alert.id).then(setHistory).catch(() => {});
      }
    }
  }, [alert.id, networkOnline, alert.version]);
  
  const isCompact = !data.headline && !data.description && !data.issuedAt;

  return (
    <aside className="alert-detail" role="complementary" aria-label="Alert details">
      <div className="detail-header">
        <button className="detail-back-btn" onClick={onClose} aria-label="Close detail panel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to alerts
        </button>
      </div>
      
      <div className="detail-body">
        
        <div className="detail-title-group">
          <div className="detail-severity" style={{ color: sev.color, backgroundColor: sev.bg }}>
            <span aria-hidden="true">{sev.icon}</span> {sev.label} Severity
          </div>
          <h2 className="detail-event">{data.event}</h2>
          
          <div className="detail-area-time">
            <div>📍 {data.area || 'Unknown area'}</div>
            {data.expiresAt && <div style={{ color: data.status === 'EXPIRED' ? 'var(--severity-extreme)' : 'inherit' }}>
              {data.status === 'EXPIRED' ? 'Expired at ' : 'Valid until '}
              {formatTime(data.expiresAt)}
            </div>}
          </div>
        </div>

        {isCompact && !networkOnline && (
          <div className="sync-error" style={{ borderRadius: '6px' }}>
            <strong>Offline Mode:</strong> Full details not available. Showing cached version.
          </div>
        )}
        {isCompact && networkOnline && !full && (
          <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Loading full details...</div>
        )}

        {data.description && (
          <div className="detail-section">
            <p>{data.description}</p>
          </div>
        )}

        {data.instruction && (
          <div className="detail-section detail-instructions">
            <h3>⚠️ Official IMD Instructions</h3>
            <p>{data.instruction}</p>
          </div>
        )}

        <div className="ai-explanation">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"></path></svg>
            WeatherGPT AI Summary
          </h3>
          <p>
            This is a <strong>{sev.label}</strong> severity alert for <strong>{data.event}</strong>. {data.status === 'ACTIVE' ? `Please remain cautious in the ${data.area || 'affected'} area until ${data.expiresAt ? formatTime(data.expiresAt) : 'further notice'}. Follow the official IMD instructions above.` : 'This alert has expired or been cancelled. No further action is required.'}
          </p>
        </div>

        <hr className="detail-separator" />

        <div className="detail-section">
          <h3>Timeline</h3>
          <div className="timeline-vertical">
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <strong>Issued</strong>
                <span>{data.issuedAt ? formatTime(data.issuedAt) : 'Unknown'}</span>
              </div>
            </div>
            {history.map((h, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <strong style={{textTransform: 'capitalize'}}>{h.action}</strong>
                  <span>{formatTime(h.createdAt)}</span>
                </div>
              </div>
            ))}
            {data.expiresAt && (
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <strong>Expires</strong>
                  <span>{formatTime(data.expiresAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <button className="tech-info-toggle" onClick={() => setShowTech(!showTech)} aria-expanded={showTech}>
            Technical Information
            <span style={{ transform: showTech ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {showTech && (
            <div className="tech-info-content">
              <div className="tech-row">
                <span className="tech-label">Alert ID</span>
                <span className="tech-val">{data.id}</span>
              </div>
              <div className="tech-row">
                <span className="tech-label">Status</span>
                <span className="tech-val">{data.status || '—'}</span>
              </div>
              <div className="tech-row">
                <span className="tech-label">Urgency</span>
                <span className="tech-val">{data.urgency || '—'}</span>
              </div>
              <div className="tech-row">
                <span className="tech-label">Certainty</span>
                <span className="tech-val">{data.certainty || '—'}</span>
              </div>
              <div className="tech-row">
                <span className="tech-label">Source</span>
                <span className="tech-val">{data.source?.toUpperCase() || '—'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="original-alert-container">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            IMD Source Data
          </span>
          <button 
            onClick={() => setShowRaw(!showRaw)}
            style={{ background: 'none', border: 'none', color: 'var(--severity-minor)', cursor: 'pointer', fontSize: '13px' }}
          >
            {showRaw ? 'Hide Original Alert' : 'View Original Alert'}
          </button>
        </div>

        {showRaw && (
          <div className="raw-alert-data" style={{ marginTop: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        <div style={{textAlign: 'center', marginTop: '16px'}}>
          <button 
            onClick={() => {
               localStorage.setItem(`viewed_${data.id}`, 'true');
               onClose();
            }}
            style={{background: 'var(--text-main)', color: 'var(--bg-main)', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', width: '100%'}}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </aside>
  );
}