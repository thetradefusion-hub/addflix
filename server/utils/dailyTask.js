export const TASK_DURATION = 120;
export const TASK_REQUIRED = 95;
const VIDEO_SPEED = 12;
const MIN_GAP_MS = 700;
const MAX_GAP_MS = 2500;

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(day, count) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function assignDailyTask(day = todayKey()) {
  return {
    day,
    title: "Watch Sponsored Video",
    subtitle: "Premium Electric Cars",
    videoUrl: "/images/task-video.png",
    durationSeconds: TASK_DURATION,
    requiredPercent: TASK_REQUIRED,
    watchSeconds: 0,
    progress: 0,
    completed: false,
    roiUnlocked: false,
    roiClaimed: false,
    status: "Pending",
    lastHeartbeatAt: 0,
  };
}

export function requiredSeconds(task) {
  if (!task?.durationLocked) return Number.POSITIVE_INFINITY;
  const duration = Number(task?.durationSeconds) || 0;
  if (duration < 5) return Number.POSITIVE_INFINITY;
  const percent = Number(task?.requiredPercent) || TASK_REQUIRED;
  return Math.ceil(duration * (percent / 100));
}

export function normalizeTask(task, day = todayKey()) {
  const assigned = assignDailyTask(task?.day || day);
  const duration = Number(task?.durationSeconds) || assigned.durationSeconds;
  const progressPct = Number(task?.progress) || 0;
  const rawWatch = task?.watchSeconds;
  const deriveFromProgress = rawWatch == null || (Number(rawWatch) === 0 && progressPct > 0 && !Number(task?.lastHeartbeatAt));
  const watched = deriveFromProgress
    ? Math.round((progressPct / 100) * duration)
    : Math.max(0, Number(rawWatch) || 0);
  const watchSeconds = task?.durationLocked ? Math.min(duration, watched) : watched;
  const progress = task?.durationLocked && duration > 0
    ? Math.min(100, Math.round((watchSeconds / duration) * 100))
    : Math.min(99, progressPct);
  let status = "Pending";
  if (task?.roiClaimed) status = "Claimed";
  else if (task?.completed || task?.roiUnlocked) status = "Unlocked";
  else if (watchSeconds > 0) status = "Watching";
  return {
    ...assigned,
    ...task,
    day: task?.day || day,
    title: task?.title || assigned.title,
    subtitle: task?.subtitle || assigned.subtitle,
    videoUrl: task?.videoUrl || assigned.videoUrl,
    durationSeconds: duration,
    requiredPercent: Number(task?.requiredPercent) || TASK_REQUIRED,
    watchSeconds,
    progress: task?.completed ? Math.max(progress, Number(task?.progress) || 0) : progress,
    completed: Boolean(task?.completed),
    roiUnlocked: Boolean(task?.roiUnlocked),
    roiClaimed: Boolean(task?.roiClaimed),
    status: task?.status === "Expired" || task?.status === "Missed" ? task.status : status,
    lastHeartbeatAt: Number(task?.lastHeartbeatAt) || 0,
    lastPosition: Number(task?.lastPosition) || 0,
    durationLocked: Boolean(task?.durationLocked),
  };
}

export function applyPlayback(task, sample, now = Date.now()) {
  if (!task || task.completed) return task;
  const position = Math.max(0, Number(sample?.position) || 0);
  const reported = Number(sample?.duration);
  const required = Number(task.requiredPercent) || TASK_REQUIRED;
  const frontier = Number(task.watchSeconds) || 0;
  const playerDuration = Number.isFinite(reported) && reported >= 5 && reported <= 7200 ? Math.round(reported) : 0;
  if (playerDuration) {
    const current = Number(task.durationSeconds) || 0;
    const shrinksIntoFinish = task.durationLocked && current >= 5 && playerDuration < current - 1 && frontier > 0 && (frontier / playerDuration) * 100 >= required;
    if (!shrinksIntoFinish) {
      task.durationSeconds = playerDuration;
      task.durationLocked = true;
    }
  }
  const length = task.durationLocked && Number(task.durationSeconds) >= 5 ? Number(task.durationSeconds) : 0;
  const playing = Boolean(sample?.playing);
  const lastAt = Number(task.lastHeartbeatAt) || 0;
  const lastPos = Number(task.lastPosition) || 0;
  let credit = 0;
  if (!lastAt) {
    task.lastPosition = position;
    task.lastHeartbeatAt = now;
  } else if (playing) {
    const wall = Math.min(5, (now - lastAt) / 1000);
    const moved = position - lastPos;
    const continuous = wall >= 0.25 && moved > 0 && moved <= wall + 1.5;
    if (continuous && position > frontier) credit = Math.min(position - frontier, moved, wall);
    if (continuous || position + 1 < lastPos || Math.abs(position - frontier) < Math.abs(lastPos - frontier)) task.lastPosition = position;
    task.lastHeartbeatAt = now;
  } else {
    task.lastHeartbeatAt = now;
    if (position + 1 < lastPos) task.lastPosition = position;
  }
  const watched = frontier + credit;
  task.watchSeconds = length ? Math.min(length, watched) : watched;
  task.progress = length ? Math.min(100, Math.round((task.watchSeconds / length) * 100)) : Math.min(99, Number(task.progress) || 0);
  if (task.status === "Pending" || task.status === "Watching") task.status = task.watchSeconds > 0 ? "Watching" : "Pending";
  return task;
}

export function applyHeartbeat(task, now = Date.now()) {
  const duration = Number(task.durationSeconds) || TASK_DURATION;
  const last = Number(task.lastHeartbeatAt) || 0;
  if (!last || now - last < MIN_GAP_MS) {
    if (!last) task.lastHeartbeatAt = now;
    if (task.status === "Pending") task.status = "Watching";
    return task;
  }
  const gap = Math.min(now - last, MAX_GAP_MS);
  const add = Math.floor((gap / 1000) * VIDEO_SPEED);
  task.watchSeconds = Math.min(duration, (Number(task.watchSeconds) || 0) + add);
  task.progress = Math.min(100, Math.round((task.watchSeconds / duration) * 100));
  task.lastHeartbeatAt = now;
  task.status = "Watching";
  return task;
}

export function closeTaskDay(task) {
  const normalized = normalizeTask(task);
  let status = "Missed";
  if (normalized.roiClaimed) status = "Claimed";
  else if (normalized.completed || normalized.roiUnlocked) status = "Expired";
  return {
    day: normalized.day,
    status,
    watchSeconds: normalized.watchSeconds,
    progress: normalized.progress,
    requiredPercent: normalized.requiredPercent,
  };
}

export function rollTask(account, today = todayKey()) {
  const current = normalizeTask(account.dailyTask, today);
  if (current.day === today) {
    const shaped = Boolean(account.dailyTask?.durationSeconds);
    account.dailyTask = current;
    if (!shaped) account.markModified?.("dailyTask");
    return !shaped;
  }

  if (!Array.isArray(account.roiDays)) account.roiDays = [];
  const closing = [closeTaskDay(current)];
  let cursor = addUtcDays(current.day, 1);
  let guard = 0;
  while (cursor < today && guard < 31) {
    closing.push({ day: cursor, status: "Missed", watchSeconds: 0, progress: 0, requiredPercent: TASK_REQUIRED });
    cursor = addUtcDays(cursor, 1);
    guard += 1;
  }
  for (const row of closing) {
    if (!account.roiDays.some((item) => item.day === row.day)) account.roiDays.push(row);
  }
  account.roiDays = account.roiDays.slice(-62);
  account.dailyTask = assignDailyTask(today);
  account.markModified?.("roiDays");
  account.markModified?.("dailyTask");
  return true;
}
