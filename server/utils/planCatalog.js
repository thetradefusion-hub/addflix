import Plan from "../models/Plan.js";
import { cleanOffDays } from "./plans.js";

export const DEFAULT_PLANS = [
  { planId: "starter", name: "Starter Plan", min: 100, dailyRate: 2, maxRoi: 150, validity: 75, accent: "blue", popular: false, sort: 1 },
  { planId: "standard", name: "Standard Plan", min: 100, dailyRate: 2.5, maxRoi: 200, validity: 80, accent: "red", popular: true, sort: 2 },
  { planId: "premium", name: "Premium Plan", min: 1000, dailyRate: 3, maxRoi: 250, validity: 90, accent: "purple", popular: false, sort: 3 },
  { planId: "vip", name: "VIP Plan", min: 2000, dailyRate: 3.5, maxRoi: 300, validity: 100, accent: "amber", popular: false, sort: 4 },
];

export function presentPlan(row) {
  return {
    id: row.planId,
    name: row.name,
    min: row.min,
    dailyRoi: row.dailyRate,
    dailyRate: row.dailyRate,
    maxRoi: row.maxRoi,
    validity: row.validity,
    offDays: cleanOffDays(row.offDays),
    accent: row.accent || "red",
    popular: Boolean(row.popular),
    active: row.active !== false,
    sort: row.sort || 0,
  };
}

export async function ensurePlans() {
  const count = await Plan.countDocuments();
  if (count) return;
  await Plan.insertMany(DEFAULT_PLANS);
}

export async function listPlans({ activeOnly = false } = {}) {
  const filter = activeOnly ? { active: true } : {};
  const rows = await Plan.find(filter).sort({ sort: 1, name: 1 }).lean();
  return rows.map(presentPlan);
}

export async function findActivePlan(planId) {
  const row = await Plan.findOne({ planId: String(planId || ""), active: true }).lean();
  if (!row) return null;
  return presentPlan(row);
}
