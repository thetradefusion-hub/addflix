import Settings from "../models/Settings.js";

export async function getSettings() {
  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) settings = await Settings.create({ key: "platform" });
  return settings;
}

export function referralRatesFrom(settings) {
  return [
    { level: 1, amount: Number(settings.level1) },
    { level: 2, amount: Number(settings.level2) },
    { level: 3, amount: Number(settings.level3) },
    { level: 4, amount: Number(settings.level4) },
  ];
}

export function applyPublishedTask(task, settings) {
  if (!task || task.completed || task.roiClaimed) return false;
  const next = {
    title: settings.taskTitle,
    subtitle: settings.taskSubtitle,
    videoUrl: settings.taskVideoUrl,
    requiredPercent: Number(settings.taskRequired) || 95,
  };
  const changed = Object.entries(next).some(([key, value]) => task[key] !== value);
  if (!changed) return false;
  const videoChanged = task.videoUrl !== next.videoUrl;
  Object.assign(task, next);
  if (videoChanged) {
    task.watchSeconds = 0;
    task.progress = 0;
    task.lastPosition = 0;
    task.lastHeartbeatAt = 0;
    task.durationSeconds = 0;
    task.durationLocked = false;
    task.roiUnlocked = false;
    task.status = "Pending";
  }
  return true;
}
