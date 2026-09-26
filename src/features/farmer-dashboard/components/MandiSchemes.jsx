import React from 'react';

export function MandiSchemes({ data, language }) {
  const isHi = language === 'hi';
  const isMr = language === 'mr';

  const marketTitle = isHi ? 'बाजार की जानकारी' : isMr ? 'बाजार माहिती' : 'MARKET INFORMATION';
  const marketUnavailable = isHi ? 'सत्यापित बाजार डेटा वर्तमान में उपलब्ध नहीं है।' : isMr ? 'सत्यापित बाजार डेटा सध्या उपलब्ध नाही.' : 'Verified market data unavailable. No live/verified source is currently connected.';
  
  const schemesTitle = isHi ? 'सरकारी योजनाएं' : isMr ? 'सरकारी योजना' : 'GOVERNMENT SCHEMES';
  const schemesUnavailable = isHi ? 'वर्तमान समय सीमा सत्यापित नहीं की जा सकी।' : isMr ? 'सध्याची अंतिम मुदत सत्यापित केली जाऊ शकली नाही.' : 'Verified scheme information unavailable. No current deadline is displayed because it could not be verified.';

  return (
    <section className="mandi-schemes" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '20px', 
      marginTop: '20px' 
    }}>
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', textTransform: 'uppercase' }}>
          {marketTitle}
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          {marketUnavailable}
        </p>
      </div>

      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', textTransform: 'uppercase' }}>
          {schemesTitle}
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          {schemesUnavailable}
        </p>
      </div>
    </section>
  );
}
