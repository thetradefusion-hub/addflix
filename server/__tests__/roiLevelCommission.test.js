import test from 'node:test';
import assert from 'node:assert/strict';

import { ROI_LEVEL_RATES, levelCommission } from '../utils/roiLevelCommission.js';

test('15 levels with the published rates', () => {
  assert.deepEqual(ROI_LEVEL_RATES, [12, 8, 5, 2.5, 1.25, 1, 0.75, 0.75, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
});

test('commission is a share of the claimed ROI, not the principal', () => {
  const expected = [0.24, 0.16, 0.1, 0.05, 0.025, 0.02, 0.015, 0.015, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
  expected.forEach((amount, index) => assert.equal(levelCommission(2, index + 1), amount));
});

test('no commission outside levels 1-15 or on zero ROI', () => {
  assert.equal(levelCommission(2, 0), 0);
  assert.equal(levelCommission(2, 16), 0);
  assert.equal(levelCommission(0, 1), 0);
});
