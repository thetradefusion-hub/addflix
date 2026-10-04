import Account from "../models/Account.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

export const ROI_LEVEL_RATES = [12, 8, 5, 2.5, 1.25, 1, 0.75, 0.75, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
export const ROI_LEVEL_MIN_DIRECTS = 1;

function money4(value) {
  return Number(Number(value).toFixed(4));
}

export async function activeDirects(referralId) {
  const code = String(referralId || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ids = await User.find({ sponsorId: new RegExp(`^${code}$`, "i") }).distinct("_id");
  if (!ids.length) return 0;
  return Account.countDocuments({ user: { $in: ids }, "subscription.active": true });
}

export function levelCommission(roi, level) {
  const rate = ROI_LEVEL_RATES[level - 1];
  if (!rate || !(roi > 0)) return 0;
  return money4((money4(roi) * rate) / 100);
}

export async function creditRoiLevelIncome({ earner, roi, claimId, when, tx }) {
  const base = money4(roi);
  if (!earner || !(base > 0) || !claimId) return [];

  const credits = [];
  const skipped = [];
  const at = new Date();
  const seen = new Set([String(earner.referralId || "").toUpperCase()]);
  let sponsorCode = String(earner.sponsorId || "").trim().toUpperCase();

  for (let index = 0; index < ROI_LEVEL_RATES.length; index += 1) {
    if (!sponsorCode || seen.has(sponsorCode)) break;
    seen.add(sponsorCode);
    const sponsor = await User.findOne({ referralId: sponsorCode });
    if (!sponsor) break;
    sponsorCode = String(sponsor.sponsorId || "").trim().toUpperCase();

    const level = index + 1;
    const rate = ROI_LEVEL_RATES[index];
    const account = await Account.findOne({ user: sponsor._id });
    if (!account?.subscription?.active) {
      skipped.push({ level, rate, referralId: sponsor.referralId, name: sponsor.fullName, reason: "ID not active" });
      continue;
    }
    if ((await activeDirects(sponsor.referralId)) < ROI_LEVEL_MIN_DIRECTS) {
      skipped.push({ level, rate, referralId: sponsor.referralId, name: sponsor.fullName, reason: "No active direct" });
      continue;
    }

    const commission = levelCommission(base, level);
    if (!(commission > 0)) continue;

    if (!Array.isArray(account.levelCredits)) account.levelCredits = [];
    if (!Array.isArray(account.income)) account.income = [];
    if (!Array.isArray(account.transactions)) account.transactions = [];

    const id = `${claimId}-L${level}`;
    if (account.levelCredits.some((row) => row.id === id)) continue;

    account.balances.referral = money4((account.balances.referral || 0) + commission);
    account.balances.total = money4((account.balances.total || 0) + commission);
    account.levelCredits.unshift({
      id,
      claimId,
      date: when,
      at,
      user: earner.referralId,
      name: earner.fullName,
      level,
      rate,
      roi: base,
      commission,
      status: "Credited",
    });
    account.income.unshift({
      id,
      date: when,
      type: "Level Income",
      description: `Level ${level} · ${rate}% of ${earner.referralId} ROI $${base.toFixed(2)}`,
      amount: commission,
      status: "Credited",
      tx,
    });
    account.transactions.unshift({
      id: `${id}-tx`,
      date: when,
      type: "Level Income",
      amount: commission,
      status: "Success",
      direction: "credit",
    });
    account.markModified("balances");
    account.markModified("levelCredits");
    account.markModified("income");
    account.markModified("transactions");
    await account.save();

    credits.push({ level, rate, referralId: sponsor.referralId, name: sponsor.fullName, commission });
  }

  if (credits.length || skipped.length) {
    const paid = credits.map((row) => `L${row.level} ${row.referralId} $${row.commission}`).join(", ");
    const missed = skipped.map((row) => `L${row.level} ${row.referralId} (${row.reason})`).join(", ");
    await AuditLog.create({
      action: "roi.level.credit",
      target: earner.referralId,
      note: [`ROI $${base.toFixed(2)}`, paid && `paid ${paid}`, missed && `skipped ${missed}`].filter(Boolean).join(" · "),
      meta: { claimId, roi: base, earner: earner.referralId, earnerName: earner.fullName, credits, skipped },
    });
  }
  return credits;
}
