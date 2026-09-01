import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAdvisory } from '../src/advisoryRules.js';
test('rain takes priority over spraying-safe conditions', () => { const a = generateAdvisory({rainProbability:72,windSpeed:4,temperatureMax:25}); assert.equal(a.verdict, 'Rain expected — delay spraying'); assert.equal(a.urgency, 'medium'); });
test('wind blocks spraying when rain is absent', () => { const a = generateAdvisory({rainProbability:10,windSpeed:28,temperatureMax:25}); assert.match(a.verdict, /Strong winds/); });
test('heat recommends early irrigation', () => { const a = generateAdvisory({rainProbability:10,windSpeed:8,temperatureMax:38}); assert.match(a.action, /early morning/); });
