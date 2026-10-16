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

/** Self + entire unilevel downline investment package totals. */
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

/** Sync Account.salary from live BV; upgrade rank when threshold crossed. */
export async function syncSalaryRank(user, account) {
  if (!account) return emptySalary();
  if (!account.salary || typeof account.salary !== "object") account.salary = emptySalary();

  const ranks = await liveRanks();
  const bv = await computeTeamInvestmentBv(user);
  const matched = rankForBv(bv, ranks);
  const prevId = Number(account.salary.rank) || 0;
  const prevRank = ranks.find((row) => row.id === prevId) || ranks.find((row) => row.name === account.salary.rankName);
  const upgraded = Boolean(matched) && (!prevRank || matched.bv > prevRank.bv);

  account.salary.bv = bv;

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
      body: `${matched.name} unlocked. $${matched.daily}/day for ${matched.tenure} days (team investment BV $${bv.toFixed(2)}).`,
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
