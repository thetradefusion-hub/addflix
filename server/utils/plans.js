import { istDayKey } from "./day.js";

export function money2(value) {
  return Number(Number(value).toFixed(2));
}

export const PLANS = [
  { id: "starter", name: "Starter Plan", min: 100, dailyRate: 2, maxRoi: 150, validity: 75, accent: "blue", popular: false },
  { id: "standard", name: "Standard Plan", min: 100, dailyRate: 2.5, maxRoi: 200, validity: 80, accent: "red", popular: true },
  { id: "premium", name: "Premium Plan", min: 1000, dailyRate: 3, maxRoi: 250, validity: 90, accent: "purple", popular: false },
  { id: "vip", name: "VIP Plan", min: 2000, dailyRate: 3.5, maxRoi: 300, validity: 100, accent: "amber", popular: false },
];

export function findPlan(id) {
  return PLANS.find((plan) => plan.id === id) || null;
}

export function quotePlan(plan, amount) {
  const value = money2(amount);
  return {
    amount: value,
    dailyAmount: money2(value * (plan.dailyRate / 100)),
    cap: money2(value * (plan.maxRoi / 100)),
  };
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function currentDay() {
  return istDayKey();
}

export function weekdayOf(day = currentDay()) {
  return new Date(`${day}T00:00:00.000Z`).getUTCDay();
}

export function cleanOffDays(value) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort();
}

export function isOffDay(row, day = currentDay()) {
  return cleanOffDays(row?.offDays).includes(weekdayOf(day));
}

export function nextEarningDay(row, day = currentDay()) {
  const off = cleanOffDays(row?.offDays);
  const start = weekdayOf(day);
  for (let step = 1; step <= 7; step += 1) {
    const weekday = (start + step) % 7;
    if (!off.includes(weekday)) return WEEKDAYS[weekday];
  }
  return "";
}

export function roiDayInfo(investments = [], day = currentDay()) {
  const active = (investments || []).filter((row) => row?.status === "Active" && Number(row.cap) - Number(row.earnedRoi) > 0);
  const off = active.filter((row) => isOffDay(row, day));
  const resume = off.map((row) => nextEarningDay(row, day)).filter(Boolean);
  return {
    day,
    weekday: WEEKDAYS[weekdayOf(day)],
    activePlans: active.length,
    offPlans: off.map((row) => row.planName),
    allOff: active.length > 0 && off.length === active.length,
    resumesOn: resume[0] || "",
    offWeekdays: active.length ? [0, 1, 2, 3, 4, 5, 6].filter((weekday) => active.every((row) => cleanOffDays(row.offDays).includes(weekday))) : [],
  };
}

export function previewTodayRoi(investments = [], day = currentDay()) {
  return (investments || []).reduce((sum, row) => {
    if (row?.status !== "Active") return sum;
    if (isOffDay(row, day)) return sum;
    const room = money2(Number(row.cap) - Number(row.earnedRoi));
    if (room <= 0) return sum;
    return money2(sum + Math.min(Number(row.dailyAmount) || 0, room));
  }, 0);
}

export function applyDailyPayout(investments = [], day = currentDay()) {
  const rows = [];
  let total = 0;
  for (const row of investments || []) {
    if (row?.status !== "Active") continue;
    if (isOffDay(row, day)) continue;
    const room = money2(Number(row.cap) - Number(row.earnedRoi));
    if (room <= 0) {
      row.status = "Completed";
      row.earnedRoi = money2(row.cap);
      continue;
    }
    const credit = money2(Math.min(Number(row.dailyAmount) || 0, room));
    if (credit <= 0) continue;
    row.earnedRoi = money2(Number(row.earnedRoi) + credit);
    if (row.earnedRoi >= Number(row.cap) - 0.001) {
      row.earnedRoi = money2(row.cap);
      row.status = "Completed";
    }
    total = money2(total + credit);
    rows.push({ id: row.id, planName: row.planName, credit });
  }
  return { total, rows };
}

export function demoInvestments(earnedRoi = 28.5) {
  const standard = findPlan("standard");
  const starter = findPlan("starter");
  const quoted = quotePlan(standard, 100);
  const starterQuote = quotePlan(starter, 100);
  const earned = money2(Math.min(Math.max(0, Number(earnedRoi) || 0), quoted.cap));
  return [
    {
      id: "INV-1008",
      planId: "standard",
      planName: standard.name,
      amount: 100,
      dailyRate: standard.dailyRate,
      dailyAmount: quoted.dailyAmount,
      cap: quoted.cap,
      earnedRoi: earned,
      startDate: "15 Jul 2025",
      status: earned >= quoted.cap ? "Completed" : "Active",
      validityDays: standard.validity,
    },
    {
      id: "INV-0901",
      planId: "starter",
      planName: starter.name,
      amount: 100,
      dailyRate: starter.dailyRate,
      dailyAmount: starterQuote.dailyAmount,
      cap: starterQuote.cap,
      earnedRoi: starterQuote.cap,
      startDate: "10 Jun 2025",
      status: "Completed",
      validityDays: starter.validity,
    },
  ];
}
