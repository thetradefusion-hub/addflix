const SAMPLE_INCOME_TX = new Set([
  "TX4587...9AD1",
  "TX3892...BC4A",
  "TX7812...D4AE",
  "TX6621...21DA",
  "TX9021...38CF",
  "TX1422...9EF1",
  "TX7816...AB12",
  "TX6642...E44B",
  "TX3881...D29E",
  "TX6964...E44B",
  "TX2201...AA10",
  "TX1180...CC21",
  "TX0091...BB77",
  "TX7712...90AD",
  "TX4410...17CE",
  "TX3308...65FA",
]);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function liveIncome(rows = []) {
  return rows.filter((row) => !SAMPLE_INCOME_TX.has(row.tx));
}

export function parseLedgerDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm))?/i);
  if (match) {
    let hour = match[4] != null ? Number(match[4]) : 0;
    const minute = match[5] != null ? Number(match[5]) : 0;
    const suffix = (match[7] || "").toLowerCase();
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), hour, minute, Number(match[6] || 0));
  }
  match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (match) {
    const month = MONTHS.findIndex((name) => name.toLowerCase() === match[2].slice(0, 3).toLowerCase());
    if (month >= 0) {
      let hour = match[4] != null ? Number(match[4]) : 0;
      const minute = match[5] != null ? Number(match[5]) : 0;
      const suffix = (match[6] || "").toUpperCase();
      if (suffix === "PM" && hour < 12) hour += 12;
      if (suffix === "AM" && hour === 12) hour = 0;
      return new Date(Number(match[3]), month, Number(match[1]), hour, minute);
    }
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLedgerDate(value) {
  const date = parseLedgerDate(value);
  if (!date) return String(value || "");
  const hour = date.getHours();
  const hh = hour % 12 || 12;
  const mm = String(date.getMinutes()).padStart(2, "0");
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hh}:${mm} ${suffix}`;
}

export function liveTransactions(rows = []) {
  return rows.filter((row) => !/Jul 2026/.test(String(row.date || "")));
}

function addIncome(bucket, row) {
  const amount = Number(row.amount) || 0;
  if (row.type === "ROI Income") bucket.roi += amount;
  else if (row.type === "Referral Income" || row.type === "Level Income") bucket.referral += amount;
  else if (row.type === "Bonus Income") bucket.bonus += amount;
  else bucket.other += amount;
}

export function incomeByDay(rows = [], limit = 7, now = new Date()) {
  const days = Math.max(1, Number(limit) || 7);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(end);
    day.setDate(end.getDate() - offset);
    buckets.push({
      key: day.getTime(),
      day: `${day.getDate()} ${MONTHS[day.getMonth()]}`,
      roi: 0,
      referral: 0,
      bonus: 0,
      other: 0,
    });
  }
  const index = new Map(buckets.map((bucket, position) => [bucket.key, position]));
  for (const row of liveIncome(rows)) {
    if (row.status === "Pending") continue;
    const parsed = parseLedgerDate(row.date);
    if (!parsed) continue;
    const key = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
    const slot = index.get(key);
    if (slot == null) continue;
    addIncome(buckets[slot], row);
  }
  return buckets.map(({ key, ...point }) => ({
    ...point,
    roi: Number(point.roi.toFixed(2)),
    referral: Number(point.referral.toFixed(2)),
    bonus: Number(point.bonus.toFixed(2)),
    other: Number(point.other.toFixed(2)),
  }));
}

export function lifetimeFigures(_balances = {}, _credits = [], income = []) {
  const totals = { roi: 0, referral: 0, bonus: 0, other: 0 };
  for (const row of liveIncome(income)) {
    if (row.status === "Pending") continue;
    addIncome(totals, row);
  }
  const roi = Number(totals.roi.toFixed(2));
  const referral = Number(totals.referral.toFixed(2));
  const bonus = Number(totals.bonus.toFixed(2));
  const other = Number(totals.other.toFixed(2));
  return {
    roi,
    referral,
    bonus,
    other,
    total: Number((roi + referral + bonus + other).toFixed(2)),
  };
}
