import Account from "../models/Account.js";
import User from "../models/User.js";
import { istDayKey, istStamp } from "./day.js";
import { readSettings } from "./settings.js";
import {
  DEFAULT_SALARY_RANKS,
  emptySalary,
  getSalaryRanks,
  money2,
  nextRankAfter,
  presentSalary,
  rankForBv,
  ranksFromSettings,
} from "./salaryRanks.js";

export {
  DEFAULT_SALARY_RANKS,
  emptySalary,
  getSalaryRanks,
  presentSalary,
  rankForBv,
  nextRankAfter,
  ranksFromSettings,
};

async function liveRanks() {
  const settings = await readSettings();
  return ranksFromSettings(settings);
}

function investmentTotal(account) {
  return money2(
    (account?.investments || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
  );
}

function emptyBinary() {
  return {
    bv: 0,
    powerLeg: 0,
    secondLeg: 0,
    powerDirectId: "",
    powerDirectName: "",
    directs: [],
  };
}

/** Self + entire unilevel downline investment package totals (legacy helper / subtree). */
export async function computeTeamInvestmentBv(user) {
  const rootCode = String(user.referralId || "").trim().toUpperCase();
  if (!rootCode) return 0;

  const [selfAccount, tree] = await Promise.all([
    Account.findOne({ user: user._id }).select("investments.amount").lean(),
    User.aggregate([
      { $match: { referralId: rootCode } },
      { $limit: 1 },
      {
        $graphLookup: {
          from: User.collection.name,
          startWith: "$referralId",
          connectFromField: "referralId",
          connectToField: "sponsorId",
          as: "team",
          restrictSearchWithMatch: { role: { $ne: "admin" } },
        },
      },
      { $project: { team: { _id: 1 } } },
    ]),
  ]);

  let total = investmentTotal(selfAccount);
  const downlineIds = (tree[0]?.team || []).map((row) => row._id);
  if (downlineIds.length) {
    const accounts = await Account.find({ user: { $in: downlineIds } }).select("investments.amount").lean();
    for (const account of accounts) total = money2(total + investmentTotal(account));
  }
  return total;
}

/**
 * Binary BV from direct legs only:
 * - Each direct's business = that member's investments + their full downline investments
 * - Power leg = the direct with the highest business
 * - Second leg = sum of every other direct's business
 * - Qualifying BV = min(power, second) matching volume
 */
export async function computeBinaryInvestmentBv(user) {
  const rootCode = String(user.referralId || "").trim().toUpperCase();
  if (!rootCode) return emptyBinary();

  const escaped = rootCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const [directs, tree] = await Promise.all([
    User.find({
      sponsorId: new RegExp(`^${escaped}$`, "i"),
      role: { $ne: "admin" },
    })
      .select("_id referralId fullName sponsorId")
      .lean(),
    User.aggregate([
      { $match: { _id: user._id } },
      {
        $graphLookup: {
          from: User.collection.name,
          startWith: "$referralId",
          connectFromField: "referralId",
          connectToField: "sponsorId",
          as: "team",
          restrictSearchWithMatch: { role: { $ne: "admin" } },
        },
      },
      {
        $project: {
          team: {
            _id: 1,
            referralId: 1,
            sponsorId: 1,
            fullName: 1,
          },
        },
      },
    ]),
  ]);

  if (!directs.length) return emptyBinary();

  const team = tree[0]?.team || [];
  const directCodes = new Set(directs.map((row) => String(row.referralId || "").trim().toUpperCase()));
  const byRef = new Map();
  for (const row of directs) {
    byRef.set(String(row.referralId || "").trim().toUpperCase(), row);
  }
  for (const row of team) {
    byRef.set(String(row.referralId || "").trim().toUpperCase(), row);
  }

  const legBv = new Map();
  for (const code of directCodes) legBv.set(code, 0);

  const allIds = [...new Set([...directs.map((row) => String(row._id)), ...team.map((row) => String(row._id))])];
  const accounts = allIds.length
    ? await Account.find({ user: { $in: allIds } }).select("user investments.amount").lean()
    : [];
  const invByUser = new Map(accounts.map((row) => [String(row.user), investmentTotal(row)]));

  function powerOwner(member) {
    let code = String(member.referralId || "").trim().toUpperCase();
    if (directCodes.has(code)) return code;
    let sponsor = String(member.sponsorId || "").trim().toUpperCase();
    const seen = new Set();
    while (sponsor && !seen.has(sponsor)) {
      seen.add(sponsor);
      if (directCodes.has(sponsor)) return sponsor;
      if (sponsor === rootCode) return "";
      const parent = byRef.get(sponsor);
      if (!parent) return "";
      sponsor = String(parent.sponsorId || "").trim().toUpperCase();
    }
    return "";
  }

  for (const member of team) {
    const owner = powerOwner(member);
    if (!owner) continue;
    const inv = invByUser.get(String(member._id)) || 0;
    if (!(inv > 0)) continue;
    legBv.set(owner, money2((legBv.get(owner) || 0) + inv));
  }

  const legs = directs
    .map((row) => {
      const code = String(row.referralId || "").trim().toUpperCase();
      return {
        id: String(row._id),
        referralId: row.referralId,
        name: row.fullName || row.referralId,
        bv: money2(legBv.get(code) || 0),
      };
    })
    .sort((a, b) => b.bv - a.bv || String(a.referralId).localeCompare(String(b.referralId)));

  const power = legs[0];
  const powerLeg = money2(power?.bv || 0);
  const secondLeg = money2(legs.slice(1).reduce((sum, row) => sum + row.bv, 0));
  const bv = money2(Math.min(powerLeg, secondLeg));

  return {
    bv,
    powerLeg,
    secondLeg,
    powerDirectId: power?.referralId || "",
    powerDirectName: power?.name || "",
    directs: legs,
  };
}

/** Sync Account.salary from live binary BV; upgrade rank when threshold crossed. */
export async function syncSalaryRank(user, account) {
  if (!account) return emptySalary();
  if (!account.salary || typeof account.salary !== "object") account.salary = emptySalary();

  const ranks = await liveRanks();
  const binary = await computeBinaryInvestmentBv(user);
  const bv = binary.bv;
  const matched = rankForBv(bv, ranks);
  const prevId = Number(account.salary.rank) || 0;
  const prevRank = ranks.find((row) => row.id === prevId) || ranks.find((row) => row.name === account.salary.rankName);
  const upgraded = Boolean(matched) && (!prevRank || matched.bv > prevRank.bv);

  account.salary.bv = bv;
  account.salary.powerLeg = binary.powerLeg;
  account.salary.secondLeg = binary.secondLeg;
  account.salary.powerDirectId = binary.powerDirectId;
  account.salary.powerDirectName = binary.powerDirectName;

  if (upgraded) {
    account.salary.rank = matched.id;
    account.salary.rankName = matched.name;
    account.salary.dailyAmount = matched.daily;
    account.salary.tenure = matched.tenure;
    account.salary.startedDay = istDayKey();
    account.salary.daysPaid = 0;
    account.salary.lastPaidDay = "";
    account.salary.unlockedAt = istStamp();
    if (!Array.isArray(account.notifications)) account.notifications = [];
    account.notifications.unshift({
      id: `SALARY-UNLOCK-${matched.id}-${Date.now()}`,
      title: "Salary rank unlocked",
      body: `${matched.name} unlocked. $${matched.daily}/day for ${matched.tenure} days (binary matching BV $${bv.toFixed(2)}).`,
      kind: "wallet",
      unread: true,
      time: new Date().toISOString(),
    });
    account.markModified("notifications");
  } else if (!matched) {
    account.salary.rank = 0;
    account.salary.rankName = "";
    account.salary.dailyAmount = 0;
  } else {
    account.salary.rank = matched.id;
    account.salary.rankName = matched.name;
    account.salary.dailyAmount = matched.daily;
    account.salary.tenure = matched.tenure;
  }

  account.markModified("salary");
  return account.salary;
}

/** Credit one day of salary if eligible (idempotent per IST day). */
export async function creditDailySalary(user, account, { requireActiveSub = true } = {}) {
  if (!account) return { credited: 0 };
  const ranks = await liveRanks();
  await syncSalaryRank(user, account);

  const salary = account.salary || emptySalary();
  const rank = rankForBv(salary.bv, ranks);
  if (!rank) return { credited: 0, salary: presentSalary(salary, salary.bv, ranks) };
  if (requireActiveSub && !account.subscription?.active) {
    return { credited: 0, salary: presentSalary(salary, salary.bv, ranks), reason: "inactive" };
  }

  const tenure = Number(salary.tenure) || rank.tenure || 100;
  const daysPaid = Number(salary.daysPaid) || 0;
  if (daysPaid >= tenure) return { credited: 0, salary: presentSalary(salary, salary.bv, ranks), reason: "tenure_done" };

  const day = istDayKey();
  if (salary.lastPaidDay === day) return { credited: 0, salary: presentSalary(salary, salary.bv, ranks), reason: "already_paid" };

  const amount = money2(rank.daily);
  if (!(amount > 0)) return { credited: 0, salary: presentSalary(salary, salary.bv, ranks) };

  const when = istStamp();
  const id = `SALARY-${user.referralId}-${day}`;
  if (!Array.isArray(account.income)) account.income = [];
  if (account.income.some((row) => row.id === id)) {
    account.salary.lastPaidDay = day;
    account.markModified("salary");
    return { credited: 0, salary: presentSalary(account.salary, account.salary.bv, ranks), reason: "already_paid" };
  }

  account.balances.total = money2((account.balances.total || 0) + amount);
  account.balances.bonus = money2((account.balances.bonus || 0) + amount);
  account.income.unshift({
    id,
    date: when,
    type: "Salary Income",
    description: `${rank.name} · day ${daysPaid + 1}/${tenure}`,
    amount,
    status: "Credited",
    tx: id,
  });
  if (!Array.isArray(account.transactions)) account.transactions = [];
  account.transactions.unshift({
    id: `${id}-tx`,
    date: when,
    type: "Salary Income",
    amount,
    status: "Success",
    direction: "credit",
    description: rank.name,
  });
  if (!Array.isArray(account.notifications)) account.notifications = [];
  account.notifications.unshift({
    id: `${id}-note`,
    title: "Salary credited",
    body: `$${amount.toFixed(2)} ${rank.name} salary was added to your wallet.`,
    kind: "wallet",
    unread: true,
    time: new Date().toISOString(),
  });

  account.salary.daysPaid = daysPaid + 1;
  account.salary.lastPaidDay = day;
  account.salary.rank = rank.id;
  account.salary.rankName = rank.name;
  account.salary.dailyAmount = rank.daily;
  account.markModified("salary");
  account.markModified("balances");
  account.markModified("income");
  account.markModified("transactions");
  account.markModified("notifications");

  return { credited: amount, salary: presentSalary(account.salary, account.salary.bv, ranks) };
}

/** After an investment, refresh BV/rank for the member and every upline sponsor. */
export async function refreshSalaryChain(memberUser) {
  const seen = new Set();
  let user = memberUser;
  while (user && user.role !== "admin") {
    const key = String(user._id);
    if (seen.has(key)) break;
    seen.add(key);
    const account = await Account.findOne({ user: user._id });
    if (account) {
      await syncSalaryRank(user, account);
      await account.save();
    }
    const sponsorCode = String(user.sponsorId || "").trim().toUpperCase();
    if (!sponsorCode) break;
    user = await User.findOne({ referralId: sponsorCode, role: { $ne: "admin" } });
  }
}
