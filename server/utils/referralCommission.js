import Account from "../models/Account.js";
import User from "../models/User.js";
import { getSettings, referralRatesFrom } from "./settings.js";
import AuditLog from "../models/AuditLog.js";

export const REFERRAL_RATES = [
  { level: 1, amount: 2 },
  { level: 2, amount: 1.5 },
  { level: 3, amount: 1 },
  { level: 4, amount: 0.5 },
];

function money2(value) {
  return Number(Number(value).toFixed(2));
}

export async function creditSubscriptionReferral({ activatedUser, payment, when }) {
  if (!activatedUser || payment?.commissionPaid) return [];

  const credits = [];
  const skipped = [];
  const seen = new Set([String(activatedUser.referralId || "").toUpperCase()]);
  let sponsorCode = String(activatedUser.sponsorId || "").trim().toUpperCase();
  const settings = await getSettings();
  const rates = referralRatesFrom(settings);

  for (const rate of rates) {
    if (!sponsorCode || seen.has(sponsorCode)) break;
    seen.add(sponsorCode);
    const sponsor = await User.findOne({ referralId: sponsorCode });
    if (!sponsor) break;

    const account = await Account.findOne({ user: sponsor._id });
    if (!account?.subscription?.active) {
      skipped.push({ level: rate.level, referralId: sponsor.referralId, name: sponsor.fullName, amount: rate.amount, reason: "ID not active" });
      sponsorCode = String(sponsor.sponsorId || "").trim().toUpperCase();
      continue;
    }
    if (!Array.isArray(account.referralCredits)) account.referralCredits = [];
    if (!Array.isArray(account.income)) account.income = [];
    if (!Array.isArray(account.transactions)) account.transactions = [];

    const already = account.referralCredits.some((row) => String(row.paymentId) === String(payment.id));
    if (!already) {
      account.balances.referral = money2((account.balances.referral || 0) + rate.amount);
      account.balances.total = money2((account.balances.total || 0) + rate.amount);
      const row = {
        id: `${payment.id}-L${rate.level}`,
        paymentId: payment.id,
        date: when,
        user: activatedUser.referralId,
        name: activatedUser.fullName,
        level: rate.level,
        amount: 10,
        commission: rate.amount,
        status: "Credited",
        tx: payment.txHash,
      };
      account.referralCredits.unshift(row);
      account.income.unshift({
        id: row.id,
        date: when,
        type: "Referral Income",
        description: `Level ${rate.level} subscription · ${activatedUser.referralId}`,
        amount: rate.amount,
        status: "Credited",
        tx: payment.txHash,
      });
      account.transactions.unshift({
        id: `${row.id}-tx`,
        date: when,
        type: "Referral Income",
        amount: rate.amount,
        status: "Success",
        direction: "credit",
      });
      account.markModified("balances");
      account.markModified("referralCredits");
      account.markModified("income");
      account.markModified("transactions");
      await account.save();
    }

    credits.push({ level: rate.level, referralId: sponsor.referralId, name: sponsor.fullName, amount: rate.amount });
    sponsorCode = String(sponsor.sponsorId || "").trim().toUpperCase();
  }

  payment.commissionPaid = true;
  payment.commissions = credits;
  payment.commissionSkipped = skipped;
  if (credits.length || skipped.length) {
    const paid = credits.map((row) => `L${row.level} ${row.referralId} $${row.amount.toFixed(2)}`).join(", ");
    const missed = skipped.map((row) => `L${row.level} ${row.referralId} (${row.reason})`).join(", ");
    await AuditLog.create({
      action: "referral.credit",
      target: activatedUser.referralId,
      note: [paid && `paid ${paid}`, missed && `skipped ${missed}`].filter(Boolean).join(" · "),
      meta: { paymentId: payment.id, credits, skipped },
    });
  }
  return credits;
}

export function commissionMessage(credits) {
  if (!credits?.length) return "Subscription verified. Your ID is active. No active upline was found for commission.";
  const parts = credits.map((row) => `L${row.level} ${row.referralId} $${row.amount.toFixed(2)}`);
  return `Subscription verified. Your ID is active. Commission credited: ${parts.join(", ")}.`;
}
