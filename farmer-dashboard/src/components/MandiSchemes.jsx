import React from 'react';

export function MandiSchemes({ data }) {
  return (
    <section className="mandi-schemes">
      <div className="mandi-section">
        <h2>Live Mandi Prices</h2>
        <div className="mandi-cards">
          {data.mandiPrices?.map((m, i) => (
            <div key={i} className={`mandi-card trend-${m.trend}`}>
              <div className="mandi-header">
                <b>{m.crop}</b> <span className="mandi-advice">{m.advice}</span>
              </div>
              <div className="mandi-price">
                {m.price} <small>{m.unit}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="schemes-section">
        <h2>Govt Schemes & Subsidies</h2>
        <div className="schemes-list">
          {data.schemes?.map((s, i) => (
            <div key={i} className="scheme-card">
              <div>
                <b>{s.name}</b>
                <p>{s.description}</p>
                <span className="deadline">Apply by {s.deadline}</span>
              </div>
              <button
                className="apply-btn"
                onClick={() => alert(`Starting application flow for ${s.name}...`)}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
