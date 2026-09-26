import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line } from 'recharts';

export function SevenDayPlanner({ data, language, activeCrop }) {
  const isHi = language === 'hi';
  const isMr = language === 'mr';
  const plannerTitle = isHi ? '7-दिवसीय कृषि योजनाकार' : isMr ? '7-दिवसीय कृषी नियोजक' : '7-Day Farm Planner';

  if (!data || !data.forecast) return null;

  const cropName = activeCrop?.name?.toLowerCase();

  return (
    <section className="seven-day-planner" style={{ 
      background: '#fff', 
      padding: '24px', 
      borderRadius: '12px', 
      border: '1px solid #e2e8f0',
      marginTop: '20px' 
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', textTransform: 'uppercase' }}>
        {plannerTitle}
      </h2>

      {/* Compact Forecast Graph */}
      <div style={{ height: '160px', marginBottom: '24px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.forecast} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={false} domain={[0, 100]} />
            
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div style={{ background: '#fff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{payload[0].payload.day}</div>
                    <div style={{ color: '#3b82f6', fontSize: '14px' }}>Temp: {payload[0].payload.temperature}°C</div>
                    <div style={{ color: '#0ea5e9', fontSize: '14px' }}>Rain: {payload[0].payload.rainProbability}%</div>
                  </div>
                );
              }
              return null;
            }} />
            <Area yAxisId="left" type="monotone" dataKey="temperature" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTemp)" />
            <Line yAxisId="right" type="monotone" dataKey="rainProbability" stroke="#0ea5e9" strokeDasharray="3 3" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Cards */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {data.forecast.map((day, idx) => {
          // Dynamic evaluation mimicking advisoryEngine rules
          let outlook = "✓ Field work looks less weather-constrained";
          let outlookColor = "#16a34a";
          let bg = "#f0fdf4";

          if (day.rainProbability > 50) {
             outlook = "✕ Higher rain risk for spraying and harvest";
             outlookColor = "#dc2626";
             bg = "#fef2f2";
          } else if (day.rainProbability > 30) {
             outlook = "⚠️ Monitor rain before planning spraying";
             outlookColor = "#d97706";
             bg = "#fffbeb";
          } else if (day.temperature > 35) {
             outlook = "⚠️ High heat stress risk, prioritize watering";
             outlookColor = "#d97706";
             bg = "#fffbeb";
          }
          
          return (
            <div key={idx} style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 80px 1fr', 
              gap: '16px', 
              padding: '12px 16px', 
              background: bg, 
              borderRadius: '8px', 
              border: `1px solid ${outlookColor}40`,
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{day.day}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{day.icon}</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{day.temperature}°C</div>
                <div style={{ fontSize: '12px', color: '#3b82f6' }}>{day.rainProbability}% rain</div>
              </div>
              <div style={{ color: outlookColor, fontWeight: '500', fontSize: '14px' }}>
                {outlook}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
