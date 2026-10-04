import test from 'node:test';
import assert from 'node:assert/strict';

import { applyDailyPayout, cleanOffDays, previewTodayRoi, roiDayInfo } from '../utils/plans.js';
import { assignDailyTask, rollTask, todayKey } from '../utils/dailyTask.js';
import { istStamp } from '../utils/day.js';

const SATURDAY = '2026-10-03';
const SUNDAY = '2026-10-04';
const MONDAY = '2026-10-05';

function plan(name, offDays = []) {
  return { id: name, planName: name, status: 'Active', dailyAmount: 2, cap: 150, earnedRoi: 0, offDays };
}

test('the app day changes at midnight India time', () => {
  assert.equal(todayKey(new Date('2026-10-03T18:29:59.000Z')), '2026-10-03', '11:59:59 PM IST Saturday');
  assert.equal(todayKey(new Date('2026-10-03T18:30:00.000Z')), '2026-10-04', '12:00 AM IST Sunday');
  assert.equal(todayKey(new Date('2026-10-04T02:00:00.000Z')), '2026-10-04', '7:30 AM IST is still Sunday');
  assert.equal(todayKey({}), todayKey(), 'a non-date argument falls back to now');
  assert.equal(istStamp(new Date('2026-10-03T18:30:00.000Z')), '4 Oct 2026, 12:00 AM');
});

test('off days are cleaned to unique weekdays 0-6', () => {
  assert.deepEqual(cleanOffDays([6, '0', 6, 9, -1, 'x']), [0, 6]);
  assert.deepEqual(cleanOffDays(undefined), []);
});

test('a weekend-off plan pays nothing on Saturday and Sunday, and pays on Monday', () => {
  for (const day of [SATURDAY, SUNDAY]) {
    const rows = [plan('Starter', [0, 6])];
    assert.equal(previewTodayRoi(rows, day), 0);
    assert.equal(applyDailyPayout(rows, day).total, 0);
    assert.equal(rows[0].earnedRoi, 0, 'no ROI is added on an off day');
    assert.equal(roiDayInfo(rows, day).allOff, true);
  }
  const rows = [plan('Starter', [0, 6])];
  assert.equal(applyDailyPayout(rows, MONDAY).total, 2);
  assert.equal(roiDayInfo(rows, SATURDAY).resumesOn, 'Monday');
  assert.deepEqual(roiDayInfo(rows, SATURDAY).offWeekdays, [0, 6]);
});

test('with two plans only the earning plan pays on an off day', () => {
  const rows = [plan('Starter', [0, 6]), plan('Standard')];
  const info = roiDayInfo(rows, SATURDAY);
  assert.equal(info.allOff, false);
  assert.deepEqual(info.offPlans, ['Starter']);
  assert.deepEqual(info.offWeekdays, []);
  assert.equal(applyDailyPayout(rows, SATURDAY).total, 2);
  assert.equal(rows[0].earnedRoi, 0);
  assert.equal(rows[1].earnedRoi, 2);
});

test('a skipped weekend is recorded as Off, not Missed', () => {
  const account = { investments: [plan('Starter', [0, 6])], roiDays: [], dailyTask: assignDailyTask('2026-10-02') };
  rollTask(account, MONDAY);
  const byDay = Object.fromEntries(account.roiDays.map((row) => [row.day, row.status]));
  assert.equal(byDay['2026-10-02'], 'Missed', 'Friday was a working day');
  assert.equal(byDay[SATURDAY], 'Off');
  assert.equal(byDay[SUNDAY], 'Off');
});
