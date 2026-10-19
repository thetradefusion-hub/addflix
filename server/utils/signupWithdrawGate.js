import Account from "../models/Account.js";
import User from "../models/User.js";
import { availableBalance, money2 } from "./withdrawal.js";

const DEFAULT_PERCENT = 10;

export function ensureSignupWithdraw(account) {
  if (!account.signupWithdraw || typeof account.signupWithdraw !== "object") {
    account.signupWithdraw = { remaining: 0, withdrawn: 0 };
  }
  account.signupWithdraw.remaining = money2(account.signupWithdraw.remaining || 0);
  account.signupWithdraw.withdrawn = money2(account.signupWithdraw.withdrawn || 0);
  return account.signupWithdraw;
}

export function creditSignupRestricted(account, amount) {
  const value = money2(amount);
  if (!(value > 0)) return 0;
  const gate = ensureSignupWithdraw(account);
  gate.remaining = money2(gate.remaining + value);
  account.markModified?.("signupWithdraw");
  return value;
}

export function signupIncomeTotal(income = []) {
  return money2(
    (income || []).reduce((sum, row) => {
      const type = String(row?.type || "");
      const description = String(row?.description || "");
      const amount = Number(row?.amount) || 0;
      if (type === "Bonus Income" && /signup bonus/i.test(description)) return sum + amount;
      if (type === "Referral Income" && /^Signup bonus ·/i.test(description)) return sum + amount;
      return sum;
    }, 0)
  );
}

/** Backfill remaining from income ledger for accounts created before the gate field existed. */
export function backfillSignupWithdraw(account) {
  const gate = ensureSignupWithdraw(account);
  const credited = signupIncomeTotal(account.income);
  if (!(credited > 0)) return false;
  if (gate.remaining > 0 || gate.withdrawn > 0) return false;
  const available = availableBalance(account.balances);
  gate.remaining = money2(Math.min(available, credited));
  gate.withdrawn = 0;
  account.markModified?.("signupWithdraw");
  return true;
}

export function signupUnlockPercent(settings) {
  const value = Number(settings?.signupWithdrawDirectPercent);
  if (!Number.isFinite(value)) return DEFAULT_PERCENT;
  return Math.min(100, Math.max(0, value));
}

export function signupUnlockCap(directBusiness, percent = DEFAULT_PERCENT) {
  return money2((Number(directBusiness) || 0) * (Number(percent) || 0) / 100);
}

export async function directReferralBusiness(user) {
  const code = String(user?.referralId || "").trim().toUpperCase();
  if (!code) return 0;
  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const directs = await User.find({
    sponsorId: new RegExp(`^${escaped}$`, "i"),
    role: { $ne: "admin" },
  })
    .select("_id")
    .lean();
  if (!directs.length) return 0;
  const accounts = await Account.find({ user: { $in: directs.map((row) => row._id) } })
    .select("subscription.active subscription.amount investments.amount")
    .lean();
  let total = 0;
  for (const row of accounts) {
    if (row.subscription?.active) total += Number(row.subscription.amount) || 0;
    for (const plan of row.investments || []) {
      total += Number(plan.amount) || 0;
    }
  }
  return money2(total);
}

export function freeAvailable(balances, remaining) {
  const available = availableBalance(balances);
  const gated = money2(Math.min(available, Math.max(0, Number(remaining) || 0)));
  return money2(Math.max(0, available - gated));
}

export function gatedWithdrawable(remaining, withdrawn, unlockCap) {
  const left = money2(Math.max(0, Number(remaining) || 0));
  const capacity = money2(Math.max(0, (Number(unlockCap) || 0) - (Number(withdrawn) || 0)));
  return money2(Math.min(left, capacity));
}

export function maxCashout(account, directBusiness, percent = DEFAULT_PERCENT) {
  backfillSignupWithdraw(account);
  const gate = ensureSignupWithdraw(account);
  const unlock = signupUnlockCap(directBusiness, percent);
  const free = freeAvailable(account.balances, gate.remaining);
  const gated = gatedWithdrawable(gate.remaining, gate.withdrawn, unlock);
  return {
    directBusiness: money2(directBusiness),
    unlockPercent: Number(percent) || 0,
    unlockCap: unlock,
    remaining: gate.remaining,
    withdrawn: gate.withdrawn,
    free,
    gated,
    maxCashout: money2(free + gated),
    available: availableBalance(account.balances),
  };
}

/**
 * Free-first cashout: deduct from bonus/referral/roi buckets, then reduce gated remaining.
 * Does not touch balances.total or locked — caller handles withdraw lock vs transfer debit.
 */
export function takeFromBuckets(balances, amount, order = ["roi", "referral", "bonus"]) {
  let left = money2(amount);
  const sources = { bonus: 0, referral: 0, roi: 0 };
  const keys = Array.isArray(order) && order.length ? order : ["roi", "referral", "bonus"];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(sources, key)) continue;
    const have = money2(balances[key] || 0);
    const take = money2(Math.min(have, left));
    balances[key] = money2(have - take);
    sources[key] = take;
    left = money2(left - take);
  }
  return sources;
}

/** mode: auto (free-first), working (never touch gated), signup (take only from unlocked gated). */
export function applyGatedTake(account, amount, summary, mode = "auto") {
  const value = money2(amount);
  const gate = ensureSignupWithdraw(account);
  const free = summary?.free ?? freeAvailable(account.balances, gate.remaining);
  const unlocked = money2(summary?.gated ?? gatedWithdrawable(gate.remaining, gate.withdrawn, summary?.unlockCap));
  let gatedTake = 0;
  if (mode === "working") {
    gatedTake = 0;
  } else if (mode === "signup") {
    gatedTake = money2(Math.min(value, unlocked));
  } else {
    gatedTake = money2(Math.max(0, Math.min(value - Math.min(value, free), unlocked)));
  }
  if (gatedTake > 0) {
    gate.remaining = money2(Math.max(0, gate.remaining - gatedTake));
    gate.withdrawn = money2(gate.withdrawn + gatedTake);
    account.markModified?.("signupWithdraw");
  }
  return gatedTake;
}

export function restoreGatedTake(account, gatedTake) {
  const value = money2(gatedTake);
  if (!(value > 0)) return;
  const gate = ensureSignupWithdraw(account);
  gate.remaining = money2(gate.remaining + value);
  gate.withdrawn = money2(Math.max(0, gate.withdrawn - value));
  account.markModified?.("signupWithdraw");
}

/** After invest/other ungated spends, keep remaining from exceeding available wallet. */
export function clampSignupRemaining(account) {
  const gate = ensureSignupWithdraw(account);
  const available = availableBalance(account.balances);
  const next = money2(Math.min(gate.remaining, available));
  if (next !== gate.remaining) {
    gate.remaining = next;
    account.markModified?.("signupWithdraw");
    return true;
  }
  return false;
}

export async function presentSignupGate(account, user, settings) {
  backfillSignupWithdraw(account);
  const percent = signupUnlockPercent(settings);
  const directBusiness = await directReferralBusiness(user);
  const summary = maxCashout(account, directBusiness, percent);
  return {
    remaining: summary.remaining,
    withdrawn: summary.withdrawn,
    directBusiness: summary.directBusiness,
    unlockPercent: summary.unlockPercent,
    unlockCap: summary.unlockCap,
    free: summary.free,
    gated: summary.gated,
    maxCashout: summary.maxCashout,
    available: summary.available,
  };
}
