import React, { useState } from 'react';

export function AddCrop({ add, addCrop, language, text }) {
  const [crop, setCrop] = useState('Wheat');
  const [sowingDate, setSowingDate] = useState('');
  const [growthStage, setGrowthStage] = useState('Vegetative stage');

  if (!add) return null;

  return (
    <form className="add-crop" onSubmit={(e) => {
      e.preventDefault();
      addCrop({ name: crop, sowingDate, stage: growthStage });
    }}>
      <label>{text.addCrop}</label>
      
      <div style={{ marginBottom: '10px' }}>
        <select value={crop} onChange={(e) => setCrop(e.target.value)} style={{ width: '100%', marginBottom: '10px' }}>
          {['Wheat', 'Rice', 'Cotton', 'Maize', 'Soybean', 'Potato'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', color: '#64748b' }}>Sowing Date (Optional)</label>
        <input 
          type="date" 
          value={sowingDate} 
          onChange={(e) => setSowingDate(e.target.value)} 
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', color: '#64748b' }}>Growth Stage</label>
        <select value={growthStage} onChange={(e) => setGrowthStage(e.target.value)} style={{ width: '100%' }}>
          <option>Seedling</option>
          <option>Vegetative stage</option>
          <option>Flowering</option>
          <option>Fruiting / Grain filling</option>
          <option>Harvest ready</option>
        </select>
      </div>

      <button type="submit">{text.addCrop}</button>
    </form>
  );
}
