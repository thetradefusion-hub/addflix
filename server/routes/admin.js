import express from "express";
import Account from "../models/Account.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { requireAdmin, requireDuty } from "../middleware/requireAdmin.js";
import { notifyUser } from "../utils/notify.js";
import deskRoutes from "./adminDesk.js";
import { getSettings, readSettings } from "../utils/settings.js";
import { approveWithdrawal, money2, rejectWithdrawal } from "../utils/withdrawal.js";
import { closeTaskDay, normalizeTask, todayKey } from "../utils/dailyTask.js";
import Plan from "../models/Plan.js";
import { listPlans, presentPlan } from "../utils/planCatalog.js";
import { commissionMessage, creditSubscriptionReferral } from "../utils/referralCommission.js";
import LoginSession from "../models/LoginSession.js";
import FraudFlag from "../models/FraudFlag.js";
import Ticket from "../models/Ticket.js";
import { presentFlags } from "../utils/fraud.js";
import { buildPublicUser, signToken } from "./auth.js";
import { describeClient } from "../utils/clientInfo.js";
import { ROI_LEVEL_RATES, activeDirects } from "../utils/roiLevelCommission.js";
import { WEEKDAYS, cleanOffDays, roiDayInfo } from "../utils/plans.js";
import { APP_TIME_ZONE, istStamp, istStartOfDay } from "../utils/day.js";
import { buildAdminReport, reportCatalog } from "../utils/adminReports.js";

function stampNow() {
  return istStamp();
}

const router = express.Router();
router.use(requireAdmin);
router.use(deskRoutes);

const TX_HASH = /^0x[a-fA-F0-9]{64}$/;

function publicSettings(settings) {
  return {
    subscriptionAmount: settings.subscriptionAmount,
    signupBonus: Number(settings.signupBonus) || 0,
    level1: settings.level1,
    level2: settings.level2,
    level3: settings.level3,
    level4: settings.level4,
    minWithdraw: settings.minWithdraw,
    withdrawFeeRate: settings.withdrawFeeRate,
    taskTitle: settings.taskTitle,
    taskSubtitle: settings.taskSubtitle,
    taskVideoUrl: settings.taskVideoUrl,
    taskDuration: settings.taskDuration,
    taskRequired: settings.taskRequired,
    taskPublished: settings.taskPublished,
    bep20Rpc: settings.bep20Rpc || "",
    depositAddress: settings.depositAddress || "0x3A7F9D8e4B2c1F6d5E8a9B0c3D4eF6A7b8C9D0e1",
  };
}

async function writeAudit(admin, action, target, note, meta = {}) {
  await AuditLog.create({ admin: admin._id, action, target: String(target || ""), note, meta });
}

router.get("/overview", async (_req, res) => {
  const day = todayKey();
  const [users, accounts, audits, recent] = await Promise.all([
    User.countDocuments({ role: { $ne: "admin" } }),
    Account.find().select("user subscription.active subscriptionPayments.status dailyTask.day dailyTask.completed dailyTask.watchSeconds dailyTask.roiClaimed deposits.status withdrawals.status balances.total levelCredits.commission levelCredits.at").lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(5).lean(),
    User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).limit(5).select("fullName referralId createdAt").lean(),
  ]);
  const byUser = new Map(accounts.map((account) => [String(account.user), account]));
  let subscribers = 0;
  let tasksToday = 0;
  let claimsToday = 0;
  let pendingDeposits = 0;
  let pendingWithdrawals = 0;
  let pendingSubscriptions = 0;
  let walletTotal = 0;
  let levelPaid = 0;
  let levelToday = 0;
  const today = startOfToday();
  for (const account of accounts) {
    for (const row of account.levelCredits || []) {
      const amount = Number(row.commission || 0);
      levelPaid += amount;
      if (row.at && new Date(row.at) >= today) levelToday += amount;
    }
    if (account.subscription?.active) subscribers += 1;
    if (account.dailyTask?.day === day && (account.dailyTask.completed || account.dailyTask.watchSeconds > 0)) tasksToday += 1;
    if (account.dailyTask?.day === day && account.dailyTask.roiClaimed) claimsToday += 1;
    pendingDeposits += (account.deposits || []).filter((row) => row.status === "Pending").length;
    pendingWithdrawals += (account.withdrawals || []).filter((row) => row.status === "Pending").length;
    pendingSubscriptions += (account.subscriptionPayments || []).filter((row) => row.status === "Pending").length;
    walletTotal = money2(walletTotal + Number(account.balances?.total || 0));
  }
  res.json({
    ok: true,
    overview: {
      users,
      subscribers,
      tasksToday,
      claimsToday,
      pendingDeposits,
      pendingWithdrawals,
      pendingSubscriptions,
      walletTotal,
      levelPaid: Number(levelPaid.toFixed(4)),
      levelToday: Number(levelToday.toFixed(4)),
      recentUsers: recent.map((user) => {
        const account = byUser.get(String(user._id));
        return {
          id: user._id,
          name: user.fullName,
          referralId: user.referralId,
          joined: showDate(user.createdAt),
          subscription: Boolean(account?.subscription?.active),
          wallet: account?.balances?.total || 0,
        };
      }),
    },
    audits,
  });
});

function clip(rows, limit = 40) {
  return Array.isArray(rows) ? rows.slice(0, limit) : [];
}

function showDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: APP_TIME_ZONE });
}

function todayTask(account, today = todayKey()) {
  const raw = account?.dailyTask;
  const isToday = raw?.day === today;
  const task = isToday ? normalizeTask(raw, today) : null;
  const hasPlan = (account?.investments || []).some((row) => row.status === "Active");
  let state = "not_started";
  let label = "Not started";
  if (!account?.subscription?.active) {
    state = "locked";
    label = "ID inactive";
  } else if (task?.roiClaimed) {
    state = "claimed";
    label = "ROI claimed";
  } else if (roiDayInfo(account?.investments || [], today).allOff) {
    state = "off";
    label = "ROI off today";
  } else if (task?.completed || task?.roiUnlocked) {
    state = "done";
    label = hasPlan ? "Done · claim pending" : "Done · no plan";
  } else if (task?.watchSeconds > 0) {
    state = "watching";
    label = `Watching ${task.progress}%`;
  }
  return {
    day: today,
    state,
    label,
    progress: task ? Number(task.progress || 0) : 0,
    hasPlan,
    lastDay: isToday ? "" : raw?.day || "",
    lastStatus: isToday || !raw?.day ? "" : closeTaskDay(raw).status,
  };
}

router.get("/users", requireDuty("users"), async (req, res) => {
  const q = String(req.query.q || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = { role: { $ne: "admin" } };
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { mobile: new RegExp(q, "i") },
      { username: new RegExp(q, "i") },
      { referralId: new RegExp(q, "i") },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(50)
    .select("fullName email mobile username referralId sponsorId createdAt active").lean();
  const accounts = await Account.find({ user: { $in: users.map((user) => user._id) } })
    .select("user subscription.active subscription.activatedAt investments balances.total balances.locked dailyTask").lean();
  const byUser = new Map(accounts.map((account) => [String(account.user), account]));
  res.json({
    ok: true,
    users: users.map((user) => {
      const account = byUser.get(String(user._id));
      const activePlan = (account?.investments || []).find((row) => row.status === "Active");
      const today = todayTask(account);
      return {
        id: user._id,
        name: user.fullName,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        referralId: user.referralId,
        sponsorId: user.sponsorId,
        joined: showDate(user.createdAt),
        active: user.active !== false,
        subscription: Boolean(account?.subscription?.active),
        activatedAt: account?.subscription?.activatedAt || "",
        plan: activePlan?.planName || "None",
        wallet: account?.balances?.total || 0,
        locked: account?.balances?.locked || 0,
        todayTask: today,
      };
    }),
  });
});

router.get("/users/:id", requireDuty("users"), async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ ok: false, message: "User not found." });
  const [user, account] = await Promise.all([
    User.findById(req.params.id).select("-passwordHash -resetToken").lean(),
    Account.findOne({ user: req.params.id }).lean(),
  ]);
  if (!user || user.role === "admin") return res.status(404).json({ ok: false, message: "User not found." });
  const balances = account?.balances || {};
  const available = money2(Math.max(0, Number(balances.total || 0) - Number(balances.locked || 0)));
  const [directs, sponsor, teamUsers, sessions, tickets, flags, settings, liveDirects] = await Promise.all([
    User.countDocuments({ sponsorId: user.referralId, role: { $ne: "admin" } }),
    user.sponsorId ? User.findOne({ referralId: user.sponsorId }).select("fullName referralId").lean() : null,
    User.find({ sponsorId: user.referralId, role: { $ne: "admin" } }).select("fullName referralId active createdAt").sort({ createdAt: -1 }).limit(20).lean(),
    LoginSession.find({ user: user._id }).sort({ loggedAt: -1 }).limit(8).lean(),
    Ticket.find({ user: user._id }).sort({ updatedAt: -1 }).limit(8).lean(),
    FraudFlag.find({ $or: [{ user: user._id }, { users: String(user._id) }] }).sort({ updatedAt: -1 }).limit(8).lean(),
    readSettings(),
    activeDirects(user.referralId),
  ]);
  const today = todayTask(account);
  const task = account?.dailyTask?.day === today.day ? normalizeTask(account.dailyTask, today.day) : {};
  const levelRows = Array.isArray(account?.levelCredits) ? account.levelCredits : [];
  res.json({
    ok: true,
    user: {
      id: user._id,
      name: user.fullName,
      username: user.username,
      levelIncome: {
        total: Number(levelRows.reduce((sum, row) => sum + Number(row.commission || 0), 0).toFixed(4)),
        count: levelRows.length,
        activeDirects: liveDirects,
        idActive: Boolean(account?.subscription?.active),
        eligible: Boolean(account?.subscription?.active) && liveDirects >= 1,
      },
      levelCredits: clip(levelRows),
      email: user.email,
      mobile: user.mobile,
      country: user.country || "",
      referralId: user.referralId,
      sponsorId: user.sponsorId || "",
      sponsorName: sponsor?.fullName || "",
      active: user.active !== false,
      joined: showDate(user.createdAt),
      lastLogin: showDate(user.lastLogin),
      twoFactor: Boolean(user.twoFactorEnabled),
      pinSet: Boolean(user.transactionPin),
      walletAddress: account?.walletAddress || "",
      directs,
      team: teamUsers.map((member) => ({
        name: member.fullName,
        id: member.referralId,
        active: member.active !== false,
        joined: showDate(member.createdAt),
      })),
      subscription: account?.subscription || { active: false },
      payments: clip(account?.subscriptionPayments),
      balances: { ...balances, available },
      investments: account?.investments || [],
      dailyTask: {
        title: task.title || settings.taskTitle || "",
        subtitle: task.subtitle || settings.taskSubtitle || "",
        day: today.day,
        progress: Number(task.progress || 0),
        watchSeconds: Number(task.watchSeconds || 0),
        durationSeconds: Number(task.durationSeconds || settings.taskDuration || 0),
        completed: Boolean(task.completed),
        roiUnlocked: Boolean(task.roiUnlocked),
        roiClaimed: Boolean(task.roiClaimed),
        status: today.label,
        state: today.state,
        hasPlan: today.hasPlan,
        lastDay: today.lastDay,
        lastStatus: today.lastStatus,
      },
      roiDays: (account?.roiDays || []).slice(-7).reverse(),
      transactions: clip(account?.transactions, 15),
      deposits: clip(account?.deposits),
      withdrawals: clip(account?.withdrawals),
      income: clip(account?.income),
      referralCredits: clip(account?.referralCredits),
      videoWatches: clip(account?.videoWatches),
      notifications: clip(account?.notifications, 8).map((row) => ({
        title: row.title,
        body: row.body,
        time: row.time,
        unread: Boolean(row.unread),
      })),
      sessions: sessions.map((row) => ({
        device: row.device,
        ip: row.ip,
        location: row.location,
        current: Boolean(row.current),
        at: showDate(row.loggedAt),
      })),
      tickets: tickets.map((row) => ({
        id: row._id,
        subject: row.subject,
        status: row.status,
        updated: showDate(row.updatedAt),
      })),
      flags: await presentFlags(flags),
    },
  });
});

function startOfToday() {
  return istStartOfDay();
}

router.get("/level-income", requireDuty("audit"), async (_req, res) => {
  const [rows, audits] = await Promise.all([
    Account.aggregate([
      { $match: { "levelCredits.0": { $exists: true } } },
      { $project: { user: 1, levelCredits: 1 } },
      { $unwind: "$levelCredits" },
    ]),
    AuditLog.find({ action: "roi.level.credit" }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  const users = await User.find({ _id: { $in: [...new Set(rows.map((row) => String(row.user)))] } }).select("fullName referralId").lean();
  const byUser = new Map(users.map((user) => [String(user._id), user]));
  const today = startOfToday();
  const byLevel = ROI_LEVEL_RATES.map((rate, index) => ({ level: index + 1, rate, count: 0, amount: 0 }));
  const receivers = new Set();
  let paid = 0;
  let todayPaid = 0;
  let todayCount = 0;

  const credits = rows.map(({ user, levelCredits: row }) => {
    const receiver = byUser.get(String(user));
    const amount = Number(row.commission || 0);
    const at = row.at ? new Date(row.at) : null;
    paid += amount;
    receivers.add(String(user));
    if (at && at >= today) {
      todayPaid += amount;
      todayCount += 1;
    }
    const bucket = byLevel[Number(row.level) - 1];
    if (bucket) {
      bucket.count += 1;
      bucket.amount += amount;
    }
    return {
      id: row.id,
      claimId: row.claimId,
      date: row.date,
      at: at ? at.toISOString() : "",
      receiverId: String(user),
      receiver: receiver?.fullName || "",
      receiverCode: receiver?.referralId || "",
      from: row.user,
      fromName: row.name,
      level: row.level,
      rate: row.rate,
      roi: row.roi,
      commission: amount,
    };
  }).sort((a, b) => String(b.at).localeCompare(String(a.at)));

  const claims = audits.map((row) => {
    const meta = row.meta || {};
    const list = meta.credits || [];
    return {
      id: row._id,
      at: row.createdAt,
      earner: meta.earner || row.target,
      earnerName: meta.earnerName || "",
      roi: Number(meta.roi || 0),
      paid: Number(list.reduce((sum, item) => sum + Number(item.commission || 0), 0).toFixed(4)),
      credited: list.length,
      skipped: (meta.skipped || []).length,
      note: row.note,
    };
  });
  const skipped = audits.flatMap((row) => (row.meta?.skipped || []).map((item) => ({
    ...item,
    at: row.createdAt,
    earner: row.meta?.earner || row.target,
    roi: Number(row.meta?.roi || 0),
  })));

  res.json({
    ok: true,
    totals: {
      paid: Number(paid.toFixed(4)),
      count: credits.length,
      receivers: receivers.size,
      todayPaid: Number(todayPaid.toFixed(4)),
      todayCount,
      claims: claims.length,
    },
    byLevel: byLevel.map((row) => ({ ...row, amount: Number(row.amount.toFixed(4)) })),
    credits: credits.slice(0, 500),
    claims,
    skipped: skipped.slice(0, 200),
  });
});

router.post("/users/:id/impersonate", requireDuty("users"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role === "admin") return res.status(404).json({ ok: false, message: "User not found." });
  const info = describeClient(req);
  const session = await LoginSession.create({
    user: user._id,
    ...info,
    device: `Admin access · ${info.device}`,
    deviceId: "",
    current: false,
    loggedAt: new Date(),
  });
  await writeAudit(req.user, "user.impersonate", user.referralId, user.fullName);
  res.json({
    ok: true,
    message: `Signed in as ${user.fullName}.`,
    token: signToken(user, session._id, { act: "admin" }),
    user: buildPublicUser(user),
  });
});

router.post("/users/:id/status", requireDuty("users.status"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role === "admin") return res.status(404).json({ ok: false, message: "User not found." });
  user.active = Boolean(req.body?.active);
  await user.save();
  await writeAudit(req.user, user.active ? "user.activate" : "user.block", user.referralId, user.active ? "Activated" : "Blocked");
  res.json({ ok: true, message: user.active ? "User activated." : "User blocked.", active: user.active });
});

router.post("/users/:id/wallet", requireDuty("wallet"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role === "admin") return res.status(404).json({ ok: false, message: "User not found." });
  const bucket = String(req.body?.bucket || "");
  const amount = money2(req.body?.amount);
  const note = String(req.body?.note || "").trim();
  if (!["roi", "referral", "bonus"].includes(bucket)) {
    return res.status(400).json({ ok: false, message: "Choose ROI, referral, or bonus." });
  }
  if (!amount) return res.status(400).json({ ok: false, message: "Enter a non-zero amount." });
  if (note.length < 3) return res.status(400).json({ ok: false, message: "Add a short note for the audit log." });
  const account = await Account.findOne({ user: user._id });
  if (!account) return res.status(404).json({ ok: false, message: "Account not found." });
  const next = money2(Number(account.balances[bucket] || 0) + amount);
  const nextTotal = money2(Number(account.balances.total || 0) + amount);
  if (next < 0) return res.status(400).json({ ok: false, message: "This balance does not have enough to deduct." });
  if (nextTotal < Number(account.balances.locked || 0)) {
    return res.status(400).json({ ok: false, message: "This would drop the wallet below the locked amount." });
  }
  account.balances[bucket] = next;
  account.balances.total = nextTotal;
  account.transactions.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    type: "Admin Adjust",
    amount,
    status: "Success",
    direction: amount > 0 ? "credit" : "debit",
    description: note,
  });
  account.markModified("balances");
  account.markModified("transactions");
  await account.save();
  await writeAudit(req.user, "wallet.adjust", user.referralId, note, { bucket, amount });
  res.json({ ok: true, message: amount > 0 ? "Balance added." : "Balance deducted.", balances: account.balances });
});

router.get("/withdrawals", requireDuty("withdrawals"), async (_req, res) => {
  const accounts = await Account.find({ "withdrawals.0": { $exists: true } })
    .select("user withdrawals")
    .populate("user", "fullName email referralId")
    .lean();
  const rows = [];
  for (const account of accounts) {
    for (const row of account.withdrawals || []) {
      rows.push({
        id: row.id,
        userId: account.user?._id,
        name: account.user?.fullName || "Member",
        referralId: account.user?.referralId || "",
        amount: row.amount,
        fee: row.fee,
        receive: row.receive,
        address: row.address,
        status: row.status,
        tx: row.tx,
        date: row.date,
      });
    }
  }
  const rank = (status) => (status === "Pending" || status === "Processing" ? 0 : 1);
  rows.sort((a, b) => rank(a.status) - rank(b.status) || String(b.date).localeCompare(String(a.date)));
  res.json({ ok: true, withdrawals: rows.slice(0, 40) });
});

router.post("/withdrawals/:id/approve", requireDuty("withdrawals"), async (req, res) => {
  const txHash = String(req.body?.txHash || "").trim();
  if (!TX_HASH.test(txHash)) {
    return res.status(400).json({ ok: false, message: "Enter a 66-character transaction hash." });
  }
  const found = await findWithdrawal(req.params.id);
  if (!found) return res.status(404).json({ ok: false, message: "Withdrawal not found." });
  try {
    const row = approveWithdrawal(found.account, req.params.id, txHash);
    found.account.markModified("withdrawals");
    found.account.markModified("balances");
    found.account.markModified("transactions");
    await found.account.save();
    await writeAudit(req.user, "withdraw.approve", row.id, txHash, { amount: row.amount });
    const member = await User.findById(found.account.user);
    if (member) await notifyUser(member, { title: "Withdrawal paid", body: `$${Number(row.amount).toFixed(2)} was marked completed.`, kind: "wallet" });
    res.json({ ok: true, message: "Withdrawal marked completed." });
  } catch (error) {
    res.status(error.status || 400).json({ ok: false, message: error.message });
  }
});

router.post("/withdrawals/:id/reject", requireDuty("withdrawals"), async (req, res) => {
  const found = await findWithdrawal(req.params.id);
  if (!found) return res.status(404).json({ ok: false, message: "Withdrawal not found." });
  try {
    const row = rejectWithdrawal(found.account, req.params.id, String(req.body?.note || "Rejected by admin"));
    found.account.markModified("withdrawals");
    found.account.markModified("balances");
    found.account.markModified("transactions");
    await found.account.save();
    await writeAudit(req.user, "withdraw.reject", row.id, row.note, { amount: row.amount });
    const member = await User.findById(found.account.user);
    if (member) await notifyUser(member, { title: "Withdrawal rejected", body: `$${Number(row.amount).toFixed(2)} was unlocked.`, kind: "wallet" });
    res.json({ ok: true, message: "Withdrawal rejected and the amount unlocked." });
  } catch (error) {
    res.status(error.status || 400).json({ ok: false, message: error.message });
  }
});

router.get("/deposits", requireDuty("deposits"), async (_req, res) => {
  const accounts = await Account.find({ "deposits.0": { $exists: true } })
    .select("user deposits")
    .populate("user", "fullName referralId")
    .lean();
  const rows = [];
  for (const account of accounts) {
    for (const row of account.deposits || []) {
      rows.push({
        id: row.id,
        userId: account.user?._id,
        name: account.user?.fullName || "Member",
        referralId: account.user?.referralId || "",
        amount: row.amount,
        network: row.network,
        tx: row.tx,
        status: row.status,
        date: row.date,
      });
    }
  }
  const rank = (status) => (status === "Pending" ? 0 : 1);
  rows.sort((a, b) => rank(a.status) - rank(b.status) || String(b.date).localeCompare(String(a.date)));
  res.json({ ok: true, deposits: rows.slice(0, 40) });
});

router.post("/deposits/:id/verify", requireDuty("deposits"), async (req, res) => {
  const result = req.body?.result === "failed" ? "Failed" : "Success";
  const found = await findDeposit(req.params.id);
  if (!found) return res.status(404).json({ ok: false, message: "Deposit not found." });
  if (found.row.status !== "Pending") {
    return res.status(400).json({ ok: false, message: "This deposit is already reviewed." });
  }
  found.row.status = result;
  if (result === "Success") {
    const credit = money2(found.row.amount || 0);
    found.account.balances.total = money2(Number(found.account.balances.total || 0) + credit);
    found.account.balances.bonus = money2(Number(found.account.balances.bonus || 0) + credit);
    found.account.transactions.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      type: "Deposit",
      amount: credit,
      status: "Success",
      direction: "credit",
    });
    found.account.markModified("balances");
    found.account.markModified("transactions");
  }
  found.account.markModified("deposits");
  await found.account.save();
  await writeAudit(req.user, "deposit.verify", found.row.id, result, { amount: found.row.amount });
  const member = await User.findById(found.account.user);
  if (member) {
    await notifyUser(member, {
      title: result === "Success" ? "Deposit credited" : "Deposit failed",
      body: `$${Number(found.row.amount || 0).toFixed(2)} is ${result}.`,
      kind: "wallet",
    });
  }
  res.json({ ok: true, message: result === "Success" ? "Deposit credited." : "Deposit marked failed." });
});

router.get("/settings", requireDuty("settings"), async (_req, res) => {
  const settings = await getSettings();
  res.json({ ok: true, settings: publicSettings(settings) });
});

router.put("/settings", requireDuty("settings"), async (req, res) => {
  const settings = await getSettings();
  const body = req.body || {};
  const numbers = ["subscriptionAmount", "signupBonus", "level1", "level2", "level3", "level4", "minWithdraw", "withdrawFeeRate", "taskDuration", "taskRequired"];
  for (const key of numbers) {
    if (body[key] == null || body[key] === "") continue;
    const value = Number(body[key]);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ ok: false, message: `${key} must be a positive number.` });
    }
    settings[key] = value;
  }
  if (typeof body.taskTitle === "string" && body.taskTitle.trim()) settings.taskTitle = body.taskTitle.trim();
  if (typeof body.taskSubtitle === "string") settings.taskSubtitle = body.taskSubtitle.trim();
  if (typeof body.taskVideoUrl === "string" && body.taskVideoUrl.trim()) settings.taskVideoUrl = body.taskVideoUrl.trim();
  if (typeof body.bep20Rpc === "string") settings.bep20Rpc = body.bep20Rpc.trim();
  if (typeof body.depositAddress === "string") {
    const address = body.depositAddress.trim();
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ ok: false, message: "Deposit address must be a BEP-20 address." });
    }
    settings.depositAddress = address;
  }
  if (typeof body.taskPublished === "boolean") settings.taskPublished = body.taskPublished;
  await settings.save();
  await writeAudit(req.user, "settings.update", "platform", "Platform settings saved");
  res.json({ ok: true, message: "Settings saved.", settings: publicSettings(settings) });
});

router.get("/plans", async (_req, res) => {
  res.json({ ok: true, plans: await listPlans() });
});

router.post("/plans", async (req, res) => {
  const planId = String(req.body?.planId || "").trim().toLowerCase().replace(/\s+/g, "-");
  const name = String(req.body?.name || "").trim();
  const min = Number(req.body?.min);
  const dailyRate = Number(req.body?.dailyRate);
  const maxRoi = Number(req.body?.maxRoi);
  const validity = Number(req.body?.validity);
  if (!planId || name.length < 2) return res.status(400).json({ ok: false, message: "Plan id and name are required." });
  if (![min, dailyRate, maxRoi, validity].every((value) => Number.isFinite(value) && value > 0)) {
    return res.status(400).json({ ok: false, message: "Minimum, daily rate, cap and validity must be greater than 0." });
  }
  const offDays = cleanOffDays(req.body?.offDays);
  if (offDays.length > 6) return res.status(400).json({ ok: false, message: "Keep at least one ROI day in the week." });
  const existing = await Plan.findOne({ planId });
  if (existing) return res.status(409).json({ ok: false, message: "That plan id already exists." });
  await Plan.create({
    planId,
    name,
    min,
    dailyRate,
    maxRoi,
    validity,
    offDays,
    accent: String(req.body?.accent || "red"),
    popular: Boolean(req.body?.popular),
    active: req.body?.active !== false,
    sort: Number(req.body?.sort) || 10,
  });
  await writeAudit(req.user, "plan.create", planId, name);
  res.json({ ok: true, message: "Plan published.", plans: await listPlans() });
});

router.put("/plans/:planId", async (req, res) => {
  const plan = await Plan.findOne({ planId: req.params.planId });
  if (!plan) return res.status(404).json({ ok: false, message: "Plan not found." });
  const body = req.body || {};
  if (typeof body.name === "string" && body.name.trim()) plan.name = body.name.trim();
  for (const key of ["min", "dailyRate", "maxRoi", "validity", "sort"]) {
    if (body[key] == null || body[key] === "") continue;
    const value = Number(body[key]);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ ok: false, message: `${key} must be a number.` });
    plan[key] = value;
  }
  if (typeof body.active === "boolean") plan.active = body.active;
  if (typeof body.popular === "boolean") plan.popular = body.popular;
  const before = cleanOffDays(plan.offDays).join(",");
  if (Array.isArray(body.offDays)) {
    const offDays = cleanOffDays(body.offDays);
    if (offDays.length > 6) return res.status(400).json({ ok: false, message: "Keep at least one ROI day in the week." });
    plan.offDays = offDays;
  }
  await plan.save();
  const after = cleanOffDays(plan.offDays);
  let synced = 0;
  if (after.join(",") !== before) {
    const result = await Account.collection.updateMany(
      { investments: { $elemMatch: { planId: plan.planId, status: "Active" } } },
      { $set: { "investments.$[inv].offDays": after } },
      { arrayFilters: [{ "inv.planId": plan.planId, "inv.status": "Active" }] }
    );
    synced = result.modifiedCount || 0;
  }
  const offLabel = after.length ? `ROI off ${[1, 2, 3, 4, 5, 6, 0].filter((day) => after.includes(day)).map((day) => WEEKDAYS[day].slice(0, 3)).join(", ")}` : "ROI every day";
  await writeAudit(req.user, "plan.update", plan.planId, `${plan.active ? "Published" : "Hidden"} · ${offLabel}`, { offDays: after, synced });
  res.json({
    ok: true,
    message: synced ? `Plan saved. ${offLabel} now applies to ${synced} member account${synced === 1 ? "" : "s"}.` : "Plan saved.",
    plan: presentPlan(plan),
  });
});

router.get("/subscriptions", async (_req, res) => {
  const accounts = await Account.find({ "subscriptionPayments.0": { $exists: true } })
    .select("user subscriptionPayments")
    .populate("user", "fullName referralId email")
    .lean();
  const rows = [];
  for (const account of accounts) {
    for (const row of account.subscriptionPayments || []) {
      rows.push({
        id: row.id,
        userId: account.user?._id ? String(account.user._id) : "",
        name: account.user?.fullName || "Member",
        referralId: account.user?.referralId || "",
        email: account.user?.email || "",
        amount: row.amount,
        network: row.network || "BEP-20",
        txHash: row.txHash,
        status: row.status,
        submittedAt: row.submittedAt,
      });
    }
  }
  const rank = (status) => (status === "Pending" ? 0 : 1);
  rows.sort((a, b) => rank(a.status) - rank(b.status) || String(b.submittedAt).localeCompare(String(a.submittedAt)));
  res.json({ ok: true, subscriptions: rows.slice(0, 40) });
});

router.post("/subscriptions/:id/review", async (req, res) => {
  const result = req.body?.result === "failed" ? "failed" : "success";
  const found = await findSubscription(req.params.id);
  if (!found) return res.status(404).json({ ok: false, message: "Subscription payment not found." });
  if (found.row.status !== "Pending") {
    return res.status(400).json({ ok: false, message: "This payment is already reviewed." });
  }
  const when = stampNow();
  const member = await User.findById(found.account.user);
  if (result === "success") {
    found.row.status = "Success";
    found.row.verifiedAt = when;
    found.account.subscription.active = true;
    found.account.subscription.paymentState = "success";
    found.account.subscription.txHash = found.row.txHash;
    found.account.subscription.activatedAt = when;
    const credits = member ? await creditSubscriptionReferral({ activatedUser: member, payment: found.row, when }) : [];
    found.account.markModified("subscription");
    found.account.markModified("subscriptionPayments");
    await found.account.save();
    await writeAudit(req.user, "subscription.approve", found.row.id, member?.referralId || "", { amount: found.row.amount });
    if (member) await notifyUser(member, { title: "Subscription active", body: commissionMessage(credits), kind: "wallet" });
    return res.json({ ok: true, message: "Subscription approved. The ID is active." });
  }
  found.row.status = "Failed";
  found.row.verifiedAt = when;
  found.account.subscription.active = false;
  found.account.subscription.paymentState = "failed";
  found.account.markModified("subscription");
  found.account.markModified("subscriptionPayments");
  await found.account.save();
  await writeAudit(req.user, "subscription.reject", found.row.id, member?.referralId || "");
    if (member) await notifyUser(member, { title: "Subscription failed", body: `The $${Number(found.row.amount || 0).toFixed(2)} payment was not approved. Submit a new transaction hash.`, kind: "wallet" });
  res.json({ ok: true, message: "Subscription marked failed." });
});

async function findRow(field, id) {
  const ids = [String(id)];
  if (Number.isFinite(Number(id))) ids.push(Number(id));
  const account = await Account.findOne({ [`${field}.id`]: { $in: ids } });
  const row = (account?.[field] || []).find((item) => String(item.id) === String(id));
  return row ? { account, row } : null;
}

router.get("/reports", requireDuty("audit"), (_req, res) => {
  res.json({ ok: true, reports: reportCatalog });
});

router.get("/reports/:type", requireDuty("audit"), async (req, res) => {
  const report = await buildAdminReport(req.params.type, {
    from: String(req.query.from || ""),
    to: String(req.query.to || ""),
  });
  if (!report) return res.status(404).json({ ok: false, message: "That report is not available." });
  res.json({ ok: true, report });
});

const findSubscription = (id) => findRow("subscriptionPayments", id);
const findWithdrawal = (id) => findRow("withdrawals", id);
const findDeposit = (id) => findRow("deposits", id);

export default router;
