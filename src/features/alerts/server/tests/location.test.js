import test from 'node:test';
import assert from 'node:assert';
import { reverseGeocode } from '../services/location.js';

test('Location Service - reverseGeocode', async (t) => {
  await t.test('rejects invalid coordinates', async () => {
    await assert.rejects(
      () => reverseGeocode('invalid', 85),
      /Invalid coordinates/
    );
    await assert.rejects(
      () => reverseGeocode(100, 85),
      /out of range/
    );
  });

  // Note: we're not actually calling the external API in these tests 
  // to avoid flakiness and rate limiting. A mock would be better for a full test suite.
});
