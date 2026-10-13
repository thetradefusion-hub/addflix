import test from "node:test";
import assert from "node:assert/strict";
import { applyPlayback, assignDailyTask } from "../utils/dailyTask.js";

function task(extra = {}) {
  return {
    ...assignDailyTask("2026-10-13"),
    durationSeconds: 100,
    durationLocked: true,
    requiredPercent: 95,
    watchSeconds: 0,
    progress: 0,
    lastHeartbeatAt: 0,
    lastPosition: 0,
    ...extra,
  };
}

test("normal playback credits the seconds that actually played", () => {
  const row = task({ lastHeartbeatAt: 1_000, lastPosition: 10, watchSeconds: 10 });
  applyPlayback(row, { position: 11.1, duration: 100, playing: true }, 2_000);
  assert.equal(row.watchSeconds >= 11 && row.watchSeconds <= 12, true, row.watchSeconds);
  assert.equal(row.progress, Math.round(row.watchSeconds));
});

test("a buffering gap still counts if the playhead only moved with wall time", () => {
  const row = task({ lastHeartbeatAt: 1_000, lastPosition: 40, watchSeconds: 40 });
  applyPlayback(row, { position: 40, duration: 100, playing: false }, 3_000);
  applyPlayback(row, { position: 43.2, duration: 100, playing: true }, 4_200);
  assert.equal(row.watchSeconds > 40, true, row.watchSeconds);
});

test("skipping ahead does not jump the counted time", () => {
  const row = task({ lastHeartbeatAt: 1_000, lastPosition: 12, watchSeconds: 12 });
  applyPlayback(row, { position: 80, duration: 100, playing: true }, 2_000);
  assert.equal(row.watchSeconds <= 13, true, row.watchSeconds);
});

test("ending the video fills the remaining required watch time", () => {
  const row = task({ lastHeartbeatAt: 1_000, lastPosition: 94, watchSeconds: 94, progress: 94 });
  applyPlayback(row, { position: 100, duration: 100, playing: false, ended: true }, 2_000);
  assert.equal(row.watchSeconds, 100);
  assert.equal(row.progress, 100);
});
