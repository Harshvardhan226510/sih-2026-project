import React from 'react';

export const WeatherParticles = ({ particleType }) => {
  if (particleType === 'rain') {
    return (
      <div className="weather-particle-layer rain">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="raindrop-particle"
            style={{
              left: `${(i * 5) % 100}%`,
              animationDuration: `${0.6 + (i % 5) * 0.1}s`,
              animationDelay: `${(i % 10) * 0.1}s`
            }}
          />
        ))}
      </div>
    );
  }

  if (particleType === 'snow') {
    return (
      <div className="weather-particle-layer snow">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="snowflake-particle"
            style={{
              left: `${(i * 5.5) % 100}%`,
              animationDuration: `${3 + (i % 4)}s`,
              animationDelay: `${(i % 5) * 0.4}s`
            }}
          />
        ))}
      </div>
    );
  }

  if (particleType === 'lightning') {
    return (
      <div className="weather-particle-layer lightning">
        <div className="lightning-flash-overlay" />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="raindrop-particle storm-rain"
            style={{
              left: `${(i * 8) % 100}%`,
              animationDuration: `${0.5 + (i % 4) * 0.08}s`,
              animationDelay: `${(i % 7) * 0.09}s`
            }}
          />
        ))}
      </div>
    );
  }

  if (particleType === 'sunrays') {
    return (
      <div className="weather-particle-layer sunrays">
        <div className="sun-ray-beam beam-1" />
        <div className="sun-ray-beam beam-2" />
      </div>
    );
  }

  return null;
};
