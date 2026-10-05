import express from "express";
import Account, { defaultDailyTask } from "../models/Account.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { applyDailyPayout, cleanOffDays, demoInvestments, previewTodayRoi, quotePlan, roiDayInfo } from "../utils/plans.js";
import { findActivePlan } from "../utils/planCatalog.js";
import { applyPlayback, requiredSeconds, todayKey } from "../utils/dailyTask.js";
import { parsePlayableUrl } from "../utils/videoUrl.js";
import { buildNetwork } from "../utils/network.js";
import { BEP20_ADDRESS, availableBalance, lockFunds, quoteWithdrawal } from "../utils/withdrawal.js";
import { applyPublishedTask, getSettings, readSettings } from "../utils/settings.js";
import Ticket from "../models/Ticket.js";
import AuditLog from "../models/AuditLog.js";
import Video from "../models/Video.js";
import { flagSkip } from "../utils/fraud.js";
import { notifyUser } from "../utils/notify.js";
import { creditRoiLevelIncome } from "../utils/roiLevelCommission.js";
import { istStamp } from "../utils/day.js";

const router = express.Router();

function stamp() {
  return istStamp();
}

function money2(value) {
  return Number(Number(value).toFixed(2));
}

function debitLiquid(account, amount) {
  let left = amount;
  for (const key of ["bonus", "referral", "roi"]) {
    const have = money2(account.balances[key] || 0);
    const take = Math.min(have, left);
    account.balances[key] = money2(have - take);
    left = money2(left - take);
  }
  account.balances.total = money2(account.balances.total - amount);
}

async function ensureInvestments(account) {
  if (!account.$isDefault("investments")) {
    if (!Array.isArray(account.investments)) account.investments = [];
    return;
  }
  const user = await User.findById(account.user).select("email").lean();
  account.investments = user?.email === "rahul.kumar@example.com"
    ? demoInvestments(account.balances?.roi)
    : [];
  account.markModified("investments");
  await account.save();
}

async function loadAccount(userId) {
  let [account, settings] = await Promise.all([Account.findOne({ user: userId }), readSettings()]);
  if (!account) {
    account = await Account.create({ user: userId, dailyTask: defaultDailyTask(), investments: [] });
  }
  await ensureInvestments(account);
  const rolled = account.rollTaskDay();
  const taskUpdated = applyPublishedTask(account.dailyTask, settings);
  if (taskUpdated) account.markModified("dailyTask");
  if (rolled || taskUpdated) await account.save();
  return account;
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const account = await loadAccount(req.user._id);
  res.json({ ok: true, account: account.toClient() });
});

router.patch("/wallet-address", async (req, res) => {
  const address = String(req.body?.address || "").trim();
  const pin = String(req.body?.pin || "").trim();
  if (!BEP20_ADDRESS.test(address)) {
    return res.status(400).json({ ok: false, message: "Enter a valid BEP-20 wallet address." });
  }
  if (!/^\d{6}$/.test(pin) || pin !== req.user.transactionPin) {
    return res.status(400).json({ ok: false, message: "Withdrawal PIN is incorrect." });
  }
  const account = await loadAccount(req.user._id);
  account.walletAddress = address;
  await account.save();
  res.json({ ok: true, message: "Payout wallet updated.", account: account.toClient() });
});

router.get("/network", async (req, res) => {
  res.json({ ok: true, network: await buildNetwork(req.user) });
});

router.get("/videos", async (req, res) => {
  const account = await loadAccount(req.user._id);
  const day = todayKey();
  const videos = await Video.find({ active: true }).sort({ createdAt: -1 }).lean();
  const watches = Array.isArray(account.videoWatches) ? account.videoWatches : [];
  res.json({
    ok: true,
    videos: videos.map(presentVideo),
    watchedIds: watches.filter((row) => row.day === day).map((row) => String(row.videoId)),
    earnings: watches.slice(0, 8),
    todayCount: watches.filter((row) => row.day === day).length,
  });
});

router.post("/videos/:id/complete", async (req, res) => {
  const progress = Number(req.body?.progress || 0);
  if (progress < 80) return res.status(400).json({ ok: false, message: "Watch at least 80% of the video." });
  const video = await Video.findOne({ _id: req.params.id, active: true });
  if (!video) return res.status(404).json({ ok: false, message: "Video not found." });
  const account = await loadAccount(req.user._id);
  const day = todayKey();
  if (!Array.isArray(account.videoWatches)) account.videoWatches = [];
  if (account.videoWatches.some((row) => String(row.videoId) === String(video._id) && row.day === day)) {
    return res.status(400).json({ ok: false, message: "You already completed this video today." });
  }
  const reward = money2(video.reward || 0);
  const when = stamp();
  account.videoWatches.unshift({ videoId: String(video._id), day, title: video.title, amount: reward, at: when });
  account.videoWatches = account.videoWatches.slice(0, 40);
  if (reward > 0) {
    account.balances.bonus = money2((account.balances.bonus || 0) + reward);
    account.balances.total = money2((account.balances.total || 0) + reward);
    account.income.unshift({
      id: Date.now(),
      date: when,
      type: "Bonus Income",
      description: video.title,
      amount: reward,
      status: "Credited",
      tx: `VID${String(video._id).slice(-6)}`,
    });
    account.transactions.unshift({
      id: Date.now() + 1,
      date: when,
      type: "Bonus",
      amount: reward,
      status: "Success",
      direction: "credit",
    });
    account.markModified("balances");
    account.markModified("income");
    account.markModified("transactions");
  }
  account.markModified("videoWatches");
  video.views = Number(video.views || 0) + 1;
  await video.save();
  await account.save();
  res.json({
    ok: true,
    message: reward > 0 ? `+${reward.toFixed(2)} USDT credited for watching.` : "Video completed. This title has no reward yet.",
    account: account.toClient(),
  });
});

function presentVideo(row) {
  const seconds = Number(row.durationSeconds) || 0;
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return {
    id: row._id,
    title: row.title,
    url: row.url,
    category: row.category || "Promo",
    reward: Number(row.reward) || 0,
    duration: `${mins}:${secs}`,
    durationSeconds: seconds,
    views: row.views || 0,
  };
}

router.post("/subscription/submit", async (req, res) => {
  const account = await loadAccount(req.user._id);
  if (!Array.isArray(account.subscriptionPayments)) account.subscriptionPayments = [];
  const txHash = String(req.body?.txHash || "").trim();
  if (txHash.length < 8) {
    return res.status(400).json({ ok: false, message: "Enter a valid transaction hash." });
  }
  if (account.subscription.active) {
    return res.status(400).json({ ok: false, message: "Your subscription is already active." });
  }
  if ((account.subscriptionPayments || []).some((row) => row.status === "Pending")) {
    return res.status(400).json({ ok: false, message: "A payment is already waiting for verification." });
  }
  const settings = await getSettings();
  const when = stamp();
  account.subscriptionPayments.unshift({
    id: Date.now(),
    txHash,
    amount: Number(settings.subscriptionAmount) || 10,
    network: "BEP-20",
    status: "Pending",
    submittedAt: when,
    verifiedAt: "",
  });
  account.subscription.active = false;
  account.subscription.paymentState = "pending";
  account.subscription.txHash = txHash;
  account.markModified("subscription");
  account.markModified("subscriptionPayments");
  await account.save();
  return res.json({ ok: true, message: "Payment submitted. Status is Pending until verification.", account: account.toClient() });
});

router.post("/subscription/verify", async (_req, res) => {
  res.status(403).json({ ok: false, message: "Subscription payments are reviewed by admin." });
});

router.post("/subscription", async (_req, res) => {
  res.status(403).json({ ok: false, message: "Subscription status is set by admin after payment review." });
});

router.post("/invest", async (req, res) => {
  const account = await loadAccount(req.user._id);
  if (!account.subscription.active) {
    return res.status(403).json({ ok: false, message: "Activate your $10 USDT subscription to use this feature." });
  }
  const plan = await findActivePlan(req.body?.planId);
  if (!plan) return res.status(400).json({ ok: false, message: "Choose a valid plan." });
  const amount = money2(req.body?.amount);
  if (!amount || amount < plan.min) {
    return res.status(400).json({ ok: false, message: `Minimum for ${plan.name} is ${plan.min} USDT.` });
  }
  const spendable = money2(account.balances.total - account.balances.locked);
  if (amount > spendable) {
    return res.status(400).json({ ok: false, message: "Insufficient wallet balance." });
  }

  const quoted = quotePlan(plan, amount);
  debitLiquid(account, amount);
  if (!Array.isArray(account.investments)) account.investments = [];
  const when = stamp();
  account.investments.unshift({
    id: `INV-${Date.now()}`,
    planId: plan.id,
    planName: plan.name,
    amount: quoted.amount,
    dailyRate: plan.dailyRate,
    dailyAmount: quoted.dailyAmount,
    cap: quoted.cap,
    earnedRoi: 0,
    startDate: when.split(",")[0],
    status: "Active",
    validityDays: plan.validity,
    offDays: cleanOffDays(plan.offDays),
  });
  account.transactions.unshift({
    id: Date.now(),
    date: when,
    type: "Investment",
    amount: -quoted.amount,
    status: "Success",
    direction: "debit",
    description: plan.name,
  });
  account.markModified("investments");
  account.markModified("balances");
  account.markModified("transactions");
  await account.save();
  return res.json({
    ok: true,
    message: `${plan.name} is active. Daily ROI is $${quoted.dailyAmount.toFixed(2)} until the $${quoted.cap.toFixed(2)} cap.`,
    account: account.toClient(),
  });
});

function liveTask(account) {
  const { dailyTask, todayRoi, roiDay } = account.toClient();
  return { ok: true, partial: true, account: { dailyTask, todayRoi, roiDay } };
}

router.post("/task", async (req, res) => {
  const account = await loadAccount(req.user._id);
  if (!account.subscription.active) {
    return res.status(403).json({ ok: false, message: "Activate your $10 USDT subscription to use this feature." });
  }
  const action = String(req.body?.action || "");
  const settings = await readSettings();
  if (!settings.taskPublished && (action === "heartbeat" || action === "complete")) {
    return res.status(403).json({ ok: false, message: "Today's task is not published." });
  }
  const roiDay = roiDayInfo(account.investments || [], account.dailyTask.day);
  if (roiDay.allOff && !account.dailyTask.roiClaimed && ["playback", "complete", "claim"].includes(action)) {
    return res.status(400).json({
      ok: false,
      offDay: true,
      message: `${roiDay.weekday} is an ROI off day for your plan. No task or ROI today${roiDay.resumesOn ? ` — it resumes on ${roiDay.resumesOn}` : ""}.`,
      account: account.toClient(),
    });
  }

  if (action === "playback") {
    if (account.dailyTask.completed) return res.json(liveTask(account));
    if (!parsePlayableUrl(account.dailyTask.videoUrl)) {
      return res.status(400).json({ ok: false, message: "Today's task needs a YouTube, Vimeo, or direct video link." });
    }
    applyPlayback(account.dailyTask, {
      position: req.body?.position,
      duration: req.body?.duration,
      playing: req.body?.playing,
    });
    account.markModified("dailyTask");
    await account.save();
    return res.json(liveTask(account));
  }

  if (action === "heartbeat") {
    if (req.body?.progress != null || req.body?.seconds != null) {
      await flagSkip(req.user, "The client tried to set watch progress instead of sending a heartbeat.");
    }
    return res.json(liveTask(account));
  }

  if (action === "progress") {
    return res.json({ ok: true, account: account.toClient() });
  }

  if (action === "complete") {
    if (account.dailyTask.completed) {
      return res.json({ ok: true, message: "Today's task is already completed.", account: account.toClient() });
    }
    const need = requiredSeconds(account.dailyTask);
    if ((account.dailyTask.watchSeconds || 0) < need) {
      await flagSkip(req.user, "Complete was requested before the required watch time.");
      return res.status(400).json({ ok: false, message: `Watch at least ${account.dailyTask.requiredPercent || 95}% of the video to complete the task.` });
    }
    account.dailyTask.completed = true;
    account.dailyTask.roiUnlocked = true;
    account.dailyTask.status = "Unlocked";
    account.tasks.unshift({
      id: Date.now(),
      date: stamp(),
      title: account.dailyTask.title || "Watch Sponsored Video",
      duration: "2 Minutes",
      completion: `${account.dailyTask.progress}%`,
      status: "Completed",
      roi: previewTodayRoi(account.investments || [], account.dailyTask.day),
      claim: "Ready",
    });
    account.markModified("dailyTask");
    account.markModified("tasks");
    await account.save();
    if (account.dailyTask.videoUrl) {
      await Video.updateOne({ url: account.dailyTask.videoUrl, active: true }, { $inc: { views: 1 } });
    }
    return res.json({ ok: true, message: "Task completed. Today's ROI is unlocked.", account: account.toClient() });
  }

  if (action === "claim") {
    if (account.dailyTask.roiClaimed) {
      return res.status(400).json({ ok: false, message: "Today's ROI is already credited." });
    }
    if (!account.dailyTask.roiUnlocked) {
      return res.status(400).json({ ok: false, message: "Complete today's activity to unlock your ROI." });
    }
    const payout = applyDailyPayout(account.investments || [], account.dailyTask.day);
    if (payout.total <= 0) {
      return res.status(400).json({ ok: false, message: "No active plan can earn ROI. Buy a plan, or the cap is already reached." });
    }
    account.dailyTask.roiClaimed = true;
    account.dailyTask.status = "Claimed";
    account.balances.total = money2(account.balances.total + payout.total);
    account.balances.roi = money2(account.balances.roi + payout.total);
    const tx = `TX${Math.floor(1000 + Math.random() * 9000)}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const when = stamp();
    const claimId = `ROI-${req.user.referralId}-${account.dailyTask.day}`;
    const planLabel = payout.rows.map((row) => row.planName).join(", ");
    account.income.unshift({
      id: claimId,
      date: when,
      type: "ROI Income",
      description: `Daily ROI (${planLabel})`,
      amount: payout.total,
      status: "Credited",
      tx,
    });
    account.transactions.unshift({
      id: Date.now() + 1,
      date: when,
      type: "ROI Credit",
      amount: payout.total,
      status: "Success",
      direction: "credit",
    });
    if (account.tasks[0]) {
      account.tasks[0].roi = payout.total;
      if (account.tasks[0].claim === "Ready") account.tasks[0].claim = "Claimed";
    }
    account.markModified("dailyTask");
    account.markModified("balances");
    account.markModified("income");
    account.markModified("transactions");
    account.markModified("tasks");
    account.markModified("investments");
    await account.save();
    await AuditLog.create({
      action: "roi.claim",
      target: req.user.referralId,
      note: `$${payout.total.toFixed(2)}`,
    });
    try {
      await creditRoiLevelIncome({ earner: req.user, roi: payout.total, claimId, when, tx });
    } catch (error) {
      console.error("ROI level income failed", claimId, error);
      await AuditLog.create({ action: "roi.level.error", target: req.user.referralId, note: `${claimId}: ${error.message}` });
    }
    return res.json({ ok: true, message: `Today's ROI of ${payout.total.toFixed(2)} USDT has been credited.`, account: account.toClient() });
  }

  return res.status(400).json({ ok: false, message: "Unknown task action." });
});

router.post("/withdraw", async (req, res) => {
  const account = await loadAccount(req.user._id);
  if (!account.subscription.active) {
    return res.status(403).json({ ok: false, message: "Activate your $10 USDT subscription to use this feature." });
  }
  const amount = money2(req.body?.amount);
  const address = String(req.body?.address || "").trim();
  const pin = String(req.body?.pin || "").trim();
  const withdrawable = availableBalance(account.balances);
  const settings = await getSettings();
  const minimum = Number(settings.minWithdraw) || 10;

  if (!amount || amount < minimum) {
    return res.status(400).json({ ok: false, message: `Minimum withdrawal is ${minimum} USDT.` });
  }
  if (amount > withdrawable) {
    return res.status(400).json({ ok: false, message: "Amount cannot exceed your withdrawable balance." });
  }
  if (!BEP20_ADDRESS.test(address)) {
    return res.status(400).json({ ok: false, message: "Enter a valid BEP-20 wallet address." });
  }
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ ok: false, message: "Enter your 6 digit transaction PIN." });
  }
  if (!req.user.transactionPin || pin !== req.user.transactionPin) {
    return res.status(400).json({ ok: false, message: "Transaction PIN is incorrect." });
  }

  const quoted = quoteWithdrawal(amount, Number(settings.withdrawFeeRate));
  const sources = lockFunds(account.balances, quoted.amount);
  const when = stamp();
  const id = Date.now();
  account.withdrawals.unshift({
    id,
    date: when,
    tx: "Pending",
    network: "BEP-20",
    amount: quoted.amount,
    fee: quoted.fee,
    receive: quoted.receive,
    status: "Pending",
    address,
    sources,
  });
  account.transactions.unshift({
    id: id + 1,
    date: when,
    type: "Withdrawal",
    amount: -quoted.amount,
    fee: quoted.fee,
    receive: quoted.receive,
    status: "Pending",
    direction: "debit",
    description: "Locked until review",
    withdrawalId: id,
  });
  account.markModified("balances");
  account.markModified("withdrawals");
  account.markModified("transactions");
  await account.save();
  return res.json({
    ok: true,
    message: `Withdrawal of $${quoted.amount.toFixed(2)} is pending. $${quoted.amount.toFixed(2)} is locked. You receive $${quoted.receive.toFixed(2)} after the ${Math.round(Number(settings.withdrawFeeRate) * 100)}% fee.`,
    account: account.toClient(),
  });
});

router.get("/tickets", async (req, res) => {
  const rows = await Ticket.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({ ok: true, tickets: rows.map(presentMemberTicket) });
});

router.post("/tickets", async (req, res) => {
  const subject = String(req.body?.subject || "").trim();
  const message = String(req.body?.message || "").trim();
  if (subject.length < 3 || message.length < 3) {
    return res.status(400).json({ ok: false, message: "Subject and message are required." });
  }
  const ticket = await Ticket.create({
    user: req.user._id,
    subject,
    status: "Open",
    messages: [{ from: "You", body: message, at: new Date().toISOString() }],
  });
  res.status(201).json({ ok: true, message: "Support request sent.", ticket: presentMemberTicket(ticket) });
});

router.post("/tickets/:id/reply", async (req, res) => {
  const body = String(req.body?.body || "").trim();
  if (body.length < 2) return res.status(400).json({ ok: false, message: "Write a reply." });
  const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });
  if (!ticket) return res.status(404).json({ ok: false, message: "Ticket not found." });
  if (ticket.status === "Resolved") return res.status(400).json({ ok: false, message: "This ticket is resolved." });
  ticket.messages.push({ from: "You", body, at: new Date().toISOString() });
  await ticket.save();
  res.json({ ok: true, message: "Reply added.", ticket: presentMemberTicket(ticket) });
});

router.post("/notifications/read", async (req, res) => {
  const account = await loadAccount(req.user._id);
  account.notifications = (account.notifications || []).map((note) => ({ ...note, unread: false }));
  account.markModified("notifications");
  await account.save();
  res.json({ ok: true, account: account.toClient() });
});

function presentMemberTicket(ticket) {
  return {
    id: ticket._id,
    subject: ticket.subject,
    status: ticket.status,
    assigneeName: ticket.assigneeName || "",
    updated: ticket.updatedAt,
    messages: ticket.messages || [],
  };
}

async function findMember(raw) {
  const value = String(raw || "").trim();
  if (value.length < 3) return null;
  const byId = await User.findOne({ referralId: value.toUpperCase(), role: { $ne: "admin" } });
  if (byId) return byId;
  return User.findOne({ username: value.toLowerCase(), role: { $ne: "admin" } });
}

router.get("/member/:code", async (req, res) => {
  const member = await findMember(req.params.code);
  if (!member || member.active === false) {
    return res.status(404).json({ ok: false, message: "Member ID was not found." });
  }
  if (String(member._id) === String(req.user._id)) {
    return res.status(400).json({ ok: false, message: "You cannot transfer to your own ID." });
  }
  res.json({ ok: true, member: { name: member.fullName, id: member.referralId } });
});

router.post("/transfer", async (req, res) => {
  const account = await loadAccount(req.user._id);
  if (!account.subscription.active) {
    return res.status(403).json({ ok: false, message: "Activate your $10 USDT subscription to use this feature." });
  }
  const amount = money2(req.body?.amount);
  const pin = String(req.body?.pin || "").trim();
  if (!amount || amount < 1) {
    return res.status(400).json({ ok: false, message: "Minimum transfer is 1 USDT." });
  }
  const spendable = availableBalance(account.balances);
  if (amount > spendable) {
    return res.status(400).json({ ok: false, message: "Amount cannot exceed your withdrawable balance." });
  }
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ ok: false, message: "Enter your 6 digit transaction PIN." });
  }
  if (!req.user.transactionPin || pin !== req.user.transactionPin) {
    return res.status(400).json({ ok: false, message: "Transaction PIN is incorrect." });
  }
  const member = await findMember(req.body?.memberId);
  if (!member || member.active === false) {
    return res.status(404).json({ ok: false, message: "Member ID was not found." });
  }
  if (String(member._id) === String(req.user._id)) {
    return res.status(400).json({ ok: false, message: "You cannot transfer to your own ID." });
  }

  const recipientAccount = await loadAccount(member._id);
  const when = stamp();
  const id = Date.now();
  debitLiquid(account, amount);
  account.transactions.unshift({
    id,
    date: when,
    type: "Transfer",
    amount: -amount,
    status: "Success",
    direction: "debit",
    description: `${member.fullName} · ${member.referralId}`,
  });
  account.markModified("balances");
  account.markModified("transactions");
  await account.save();

  recipientAccount.balances.total = money2(Number(recipientAccount.balances.total || 0) + amount);
  recipientAccount.balances.bonus = money2(Number(recipientAccount.balances.bonus || 0) + amount);
  recipientAccount.transactions.unshift({
    id: id + 1,
    date: when,
    type: "Transfer",
    amount,
    status: "Success",
    direction: "credit",
    description: `${req.user.fullName} · ${req.user.referralId}`,
  });
  recipientAccount.markModified("balances");
  recipientAccount.markModified("transactions");
  await recipientAccount.save();

  await notifyUser(member, {
    title: "Transfer received",
    body: `${req.user.fullName} sent you $${amount.toFixed(2)}.`,
    kind: "wallet",
  });
  await AuditLog.create({
    action: "wallet.transfer",
    target: member.referralId,
    note: `$${amount.toFixed(2)} from ${req.user.referralId}`,
  });

  return res.json({
    ok: true,
    message: `$${amount.toFixed(2)} sent to ${member.fullName} (${member.referralId}).`,
    account: account.toClient(),
  });
});

router.post("/deposit", async (req, res) => {
  const account = await loadAccount(req.user._id);
  const allowed = ["BEP-20", "ERC-20", "TRC-20"];
  const network = allowed.includes(req.body?.network) ? req.body.network : "BEP-20";
  const amount = money2(req.body?.amount);
  if (!amount || amount < 10) {
    return res.status(400).json({ ok: false, message: "Minimum deposit is 10 USDT." });
  }
  const tx = String(req.body?.tx || "").trim().slice(0, 120);
  const row = {
    id: Date.now(),
    date: stamp(),
    tx: tx || "Awaiting hash",
    network,
    amount,
    status: "Pending",
  };
  account.deposits.unshift(row);
  account.markModified("deposits");
  await account.save();
  return res.json({ ok: true, message: "Deposit is pending confirmation.", account: account.toClient() });
});

export default router;
