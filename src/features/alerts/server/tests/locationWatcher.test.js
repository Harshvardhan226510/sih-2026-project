import test from 'node:test';
import assert from 'node:assert';
import { calculateDistance } from '../../services/locationWatcher.js';

test('Location Watcher - calculateDistance', (t) => {
  // Test same location
  assert.strictEqual(calculateDistance(10, 10, 10, 10), 0);

  // Test known distance (approx)
  // Distance between (52.2296756, 21.0122287) Warsaw and (52.406374, 16.9251681) Poznan is ~278 km
  const dist = calculateDistance(52.2296756, 21.0122287, 52.406374, 16.9251681);
  assert.ok(dist > 270 && dist < 290);
  
  // Test minor movement (should be less than 2km)
  const minorDist = calculateDistance(20.27, 85.84, 20.271, 85.841);
  assert.ok(minorDist < 2.0);
});
