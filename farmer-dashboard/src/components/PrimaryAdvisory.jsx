import React from 'react';
import { MandiSchemes } from './MandiSchemes';

export function PrimaryAdvisory({ data, activeCrop, advice, day, setDay, text, language, setActiveCrop, setSearch }) {
  const currentDay = data.forecast[day] || data.forecast[0];

  return (
    <section className="primary">
      <div className="pill">{text.advisory}</div>
      <h1>{activeCrop ? `${activeCrop.name}: ${advice.verdict}` : advice.verdict}</h1>
      <div className="simple-guide">
        <article>
          <span>✓</span>
          <div>
            <b>{text.now}</b>
            <p>{advice.action}</p>
          </div>
        </article>
        <article>
          <span>?</span>
          <div>
            <b>{text.why}</b>
            <p>{advice.reason}</p>
          </div>
        </article>
        <article>
          <span>!</span>
          <div>
            <b>{text.avoid}</b>
            <p>
              {language === 'en'
                ? 'Do not spray before rain or in strong wind.'
                : language === 'hi'
                ? 'बारिश या तेज हवा से पहले छिड़काव न करें।'
                : 'पावसापूर्वी किंवा जोराच्या वाऱ्यात फवारणी करू नका.'}
            </p>
          </div>
        </article>
      </div>
      
      <div className="forecast">
        <svg viewBox="0 0 700 150" preserveAspectRatio="none">
          <path d="M0 110 C70 95 80 120 150 92 S250 70 300 98 S390 128 450 78 S550 50 600 82 S650 110 700 65" />
        </svg>
        <div className="forecast-points">
          {data.forecast.map((x, i) => (
            <button
              key={`${x.day}-${i}`}
              onClick={() => setDay(i)}
              className={day === i ? 'selected' : ''}
            >
              <b>{x.temperature}°</b>
              <span>{x.icon}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="days">
        {data.forecast.map((x, i) => (
          <button
            onClick={() => setDay(i)}
            className={day === i ? 'active' : ''}
            key={`${x.day}-${i}`}
          >
            {x.day}
          </button>
        ))}
      </div>
      
      <p className="selection">
        {text.forecast} {currentDay.day}, {currentDay.temperature}°C · {text.rain}:{' '}
        {currentDay.rainProbability ?? '—'}%
      </p>

      <MandiSchemes data={data} />

      <section className="today-actions" aria-label="Simple farm tasks">
        <h2>Today on your farm</h2>
        <button onClick={() => setActiveCrop(data.crops[0])}>
          💧 Check soil before watering <span>Tap to see crop advice</span>
        </button>
        <button onClick={() => document.querySelector('.primary')?.scrollIntoView({ behavior: 'smooth' })}>
          🌦 Check rain before spraying <span>{data.current.rainProbability}% rain chance</span>
        </button>
        <button onClick={() => setSearch(true)}>
          📍 Confirm your farm location <span>Change location</span>
        </button>
      </section>
    </section>
  );
}
