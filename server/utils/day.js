export const APP_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60 * 1000;

export function istDayKey(date = new Date()) {
  const when = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return new Date(when.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function istStamp(date = new Date()) {
  const d = new Date(date.getTime() + IST_OFFSET_MS);
  const hour = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hour % 12 || 12}:${mm} ${hour >= 12 ? "PM" : "AM"}`;
}

export function istStartOfDay(date = new Date()) {
  return new Date(`${istDayKey(date)}T00:00:00.000+05:30`);
}
