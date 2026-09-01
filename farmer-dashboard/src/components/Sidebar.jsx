import React from 'react';
import { Icon } from './Icon';

export function Sidebar({ data, text, activeCrop, setActiveCrop, setSearch }) {
  return (
    <aside>
      <article className="conditions-card">
        <button className="location" onClick={() => setSearch(true)}>
          ⌖ {data.farmer.location} <small>Change</small>
        </button>
        <div className="temperature">
          {data.current.temperature}°<small>C</small>
        </div>
        <div className="stats">
          <span>
            ≋ <b>{data.current.windSpeed}</b> km/h {text.wind}
          </span>
          <span>
            ◯ <b>{data.current.rainProbability}%</b> {text.rain}
          </span>
          <span>
            ♧ <b>{data.current.humidity}%</b> {text.humidity}
          </span>
        </div>
      </article>
      <div className="crops">
        {data.crops?.map((x, i) => (
          <button
            className={`crop-card ${activeCrop?.name === x.name ? 'crop-active' : ''}`}
            onClick={() => setActiveCrop(x)}
            key={`${x.name}-${i}`}
          >
            
            <div>
              <p className="eyebrow">{x.stage}</p>
              <h3>{x.name}</h3>
              <p>
                <span className={`status-dot ${x.urgency?.toLowerCase() || 'medium'}`} />
                {x.status} · {x.urgency} priority
              </p>
            </div>
            <Icon>{x.icon}</Icon>
          </button>
        ))}
      </div>
    </aside>
  );
}
