import { useState, useEffect } from 'react';
import { getSeverityConfig, formatTime } from '../utils.js';
import { AlertMap } from './AlertMap.jsx';
import { fetchAlert, fetchAlertHistory } from '../services/alertApi.js';
export function AlertDetail({ alert, onClose, networkOnline }) {
  const [full, setFull] = useState(null);
  const [history, setHistory] = useState([]);
  const [lang, setLang] = useState('en');
  const sev = getSeverityConfig(alert.severity);
  
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
  
  const data = full || alert;
  const isCompact = !data.headline && !data.description && !data.issuedAt;

  return (
    <aside className="alert-detail" role="complementary" aria-label="Alert details">
      <div className="detail-header">
        <button className="detail-close" onClick={onClose} aria-label="Close detail panel">&times;</button>
      </div>
      <div className="detail-body">
        <div className="detail-severity" style={{ color: sev.color, backgroundColor: sev.bg }}>
          <span aria-hidden="true">{sev.icon}</span> {sev.label}
        </div>
        <h2 className="detail-event">{data.event}</h2>
        {data.headline && <p className="detail-headline">{data.headline}</p>}
        {isCompact && !networkOnline && (
          <div className="compact-warning" style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <strong>Offline Mode:</strong> Full details for this alert are not available without a network connection. Showing cached version.
          </div>
        )}
        {isCompact && networkOnline && !full && (
          <div style={{ color: '#666', fontStyle: 'italic', marginBottom: '1rem' }}>Loading full details...</div>
        )}

        <div className="detail-timeline" style={{display:'flex', gap:'1rem', fontSize:'0.85em', color:'#555', margin:'1rem 0', padding:'0.5rem', background:'#f8fafc', borderRadius:'4px'}}>
          <div className="timeline-step">
            <strong>Issued</strong><br/>{data.issuedAt ? formatTime(data.issuedAt) : '—'}
          </div>
          {data.updatedAt && (
            <div className="timeline-step">
              <strong>Updated</strong><br/>{formatTime(data.updatedAt)}
            </div>
          )}
          <div className="timeline-step">
            <strong>Expires</strong><br/>{data.expiresAt ? formatTime(data.expiresAt) : '—'}
          </div>
        </div>

        {history.length > 0 && (
          <div className="detail-history" style={{marginBottom: '1rem', fontSize: '0.85em'}}>
            <h4 style={{margin: '0 0 0.5rem 0', color: '#334155'}}>Update History</h4>
            <ul style={{listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid #e2e8f0', marginLeft: '0.5rem'}}>
              {history.map((h, i) => (
                <li key={i} style={{paddingLeft: '1rem', position: 'relative', paddingBottom: '0.5rem'}}>
                  <div style={{position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8'}}></div>
                  <strong style={{textTransform: 'capitalize'}}>{h.action}</strong> at {formatTime(h.createdAt)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="detail-grid">
          <dt>Affected Area</dt>
          <dd>
            {data.area || '—'}
            {data.polygon && (
              <div style={{ marginTop: '0.5rem' }}>
                <AlertMap polygon={data.polygon} networkOnline={networkOnline} />
              </div>
            )}
          </dd>
          <dt>Status</dt>
          <dd>
            {data.status ? (
              <span className={`status-tag status-${data.status.toLowerCase()}`}>{data.status}</span>
            ) : '—'}
          </dd>
          <dt>Effective</dt>
          <dd>{data.effectiveAt ? formatTime(data.effectiveAt) : '—'}</dd>
          <dt>Urgency</dt>
          <dd>{data.urgency || '—'}</dd>
          <dt>Certainty</dt>
          <dd>{data.certainty || '—'}</dd>
          <dt>Source</dt>
          <dd style={{display:'flex', alignItems:'center', gap:'0.2rem'}}>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
             {data.source === 'imd' ? 'Verified IMD Source' : data.source?.toUpperCase() || '—'}
          </dd>
        </dl>
        
        {data.description && (
          <div className="detail-section">
            <h3>Description</h3>
            <p>{data.description}</p>
          </div>
        )}
        {data.instruction && (
          <div className="detail-section detail-instructions">
            <h3>Official IMD Instructions</h3>
            <p>{data.instruction}</p>
          </div>
        )}

        <div className="ai-explanation" style={{marginTop:'1.5rem', padding:'1rem', borderLeft:'4px solid #8b5cf6', background:'#f5f3ff', borderRadius:'0 4px 4px 0', position:'relative'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{color:'#6d28d9', marginTop:0, marginBottom:'0.5rem', fontSize:'1rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              WeatherGPT AI Explanation
            </h3>
            <div className="lang-toggle" style={{display:'flex', gap:'0.2rem'}}>
              <button onClick={() => setLang('en')} style={{background: lang === 'en' ? '#c4b5fd' : 'transparent', border:'none', padding:'0.2rem 0.5rem', borderRadius:'4px', cursor:'pointer', fontSize:'0.8rem', color:'#4c1d95'}}>EN</button>
              <button onClick={() => setLang('hi')} style={{background: lang === 'hi' ? '#c4b5fd' : 'transparent', border:'none', padding:'0.2rem 0.5rem', borderRadius:'4px', cursor:'pointer', fontSize:'0.8rem', color:'#4c1d95'}}>HI</button>
            </div>
          </div>
          <p style={{margin:0, fontSize:'0.9rem', color:'#4c1d95', lineHeight:'1.5'}}>
            {lang === 'hi' ? (
              <>यह <strong>{data.event}</strong> के लिए एक <strong>{sev.label}</strong> गंभीरता की चेतावनी है। {data.status === 'ACTIVE' ? `कृपया ${data.area || 'प्रभावित'} क्षेत्र में ${data.expiresAt ? formatTime(data.expiresAt) : 'अगली सूचना'} तक सतर्क रहें। ऊपर दिए गए आधिकारिक आईएमडी निर्देशों का पालन करें।` : 'यह चेतावनी समाप्त या रद्द कर दी गई है। आगे किसी कार्रवाई की आवश्यकता नहीं है।'}</>
            ) : (
              <>This is a <strong>{sev.label}</strong> severity alert for <strong>{data.event}</strong>. {data.status === 'ACTIVE' ? `Please remain cautious in the ${data.area || 'affected'} area until ${data.expiresAt ? formatTime(data.expiresAt) : 'further notice'}. Follow the official IMD instructions above.` : 'This alert has expired or been cancelled. No further action is required.'}</>
            )}
          </p>
        </div>

        <div className="detail-actions" style={{marginTop:'2rem', textAlign:'center'}}>
          <button 
            onClick={() => {
               localStorage.setItem(`viewed_${data.id}`, 'true');
               onClose();
            }}
            style={{background:'#0f172a', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </aside>
  );
}