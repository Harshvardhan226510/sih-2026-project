import React from 'react';
import { copy } from '../utils/i18n';

export function AddCrop({ add, crop, setCrop, addCrop, language, text }) {
  if (!add) return null;
  return (
    <form className="add-crop" onSubmit={addCrop}>
      <label>{text.addCrop}</label>
      <select value={crop} onChange={(e) => setCrop(e.target.value)}>
        {['Wheat', 'Rice', 'Cotton', 'Maize', 'Soybean', 'Potato'].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <button>{text.addCrop}</button>
    </form>
  );
}
