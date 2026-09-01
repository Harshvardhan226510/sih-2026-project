import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertCard } from '../features/alerts/components/AlertCard.jsx';
import React from 'react';

// Stub out getSeverityConfig used inside AlertCard
vi.mock('../features/alerts/utils.js', () => ({
  getSeverityConfig: () => ({ color: 'red', bg: 'white', label: 'Severe' }),
  formatTime: () => '10:00 AM'
}));

describe('AlertCard', () => {
  it('renders UPDATED badge when version > 1', () => {
    const alert = { id: '1', version: 2, severity: 'Extreme', status: 'ACTIVE' };
    render(<AlertCard alert={alert} onClick={() => {}} />);
    expect(screen.getByText('UPDATED')).toBeTruthy();
  });

  it('does not render UPDATED badge when version is 1', () => {
    const alert = { id: '2', version: 1, severity: 'Extreme', status: 'ACTIVE' };
    render(<AlertCard alert={alert} onClick={() => {}} />);
    const badge = screen.queryByText('UPDATED');
    expect(badge).toBeNull();
  });
});
