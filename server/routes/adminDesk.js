import express from "express";
import User from "../models/User.js";
import Account from "../models/Account.js";
import AuditLog from "../models/AuditLog.js";
import Ticket from "../models/Ticket.js";
import FraudFlag from "../models/FraudFlag.js";
import Video from "../models/Video.js";
import CmsPage from "../models/CmsPage.js";
import Outbox from "../models/Outbox.js";
import { requireDuty } from "../middleware/requireAdmin.js";
import { adminDuty } from "../utils/roles.js";
import { notifyUser } from "../utils/notify.js";
import { presentFlags } from "../utils/fraud.js";
import { getSettings } from "../utils/settings.js";
import { parsePlayableUrl } from "../utils/videoUrl.js";

const router = express.Router();

function stamp() {
  return new Date().toISOString();
}

router.get("/session", (req, res) => {
  res.json({
    ok: true,
    user: {
      name: req.user.fullName,
      email: req.user.email,
      adminRole: adminDuty(req.user),
    },
  });
});

router.get("/audit", requireDuty("audit"), async (_req, res) => {
  const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(80).populate("admin", "fullName email adminRole").lean();
  res.json({
    ok: true,
    audits: rows.map((row) => ({
      id: row._id,
      action: row.action,
      target: row.target,
      note: row.note,
      admin: row.admin?.fullName || "System",
      role: row.admin?.adminRole || "",
      at: row.createdAt,
    })),
  });
});

router.get("/tickets", requireDuty("tickets"), async (_req, res) => {
  const rows = await Ticket.find().sort({ updatedAt: -1 }).limit(40).populate("user", "fullName referralId email").lean();
  res.json({ ok: true, tickets: rows.map(presentTicket) });
});

router.post("/tickets/:id/reply", requireDuty("tickets"), async (req, res) => {
  const body = String(req.body?.body || "").trim();
  if (body.length < 2) return res.status(400).json({ ok: false, message: "Write a reply." });
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ ok: false, message: "Ticket not found." });
  ticket.messages.push({ from: req.user.fullName, body, at: stamp() });
  ticket.assignee = req.user._id;
  ticket.assigneeName = req.user.fullName;
  if (ticket.status !== "Resolved") ticket.status = "Assigned";
  await ticket.save();
  const member = await User.findById(ticket.user);
  if (member) await notifyUser(member, { title: "Support replied", body: ticket.subject, kind: "support" });
  await AuditLog.create({ admin: req.user._id, action: "ticket.reply", target: String(ticket._id), note: ticket.subject });
  res.json({ ok: true, message: "Reply sent. In-app notice is delivered. Email, SMS and push are queued for demo." });
});

router.post("/tickets/:id/resolve", requireDuty("tickets"), async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ ok: false, message: "Ticket not found." });
  ticket.status = "Resolved";
  await ticket.save();
  await AuditLog.create({ admin: req.user._id, action: "ticket.resolve", target: String(ticket._id), note: ticket.subject });
  res.json({ ok: true, message: "Ticket resolved." });
});

router.get("/fraud", requireDuty("fraud"), async (_req, res) => {
  const rows = await FraudFlag.find().sort({ updatedAt: -1 }).limit(40).lean();
  res.json({ ok: true, flags: await presentFlags(rows) });
});

router.post("/fraud/:id/close", requireDuty("fraud"), async (req, res) => {
  const flag = await FraudFlag.findById(req.params.id);
  if (!flag) return res.status(404).json({ ok: false, message: "Flag not found." });
  flag.status = "Closed";
  await flag.save();
  await AuditLog.create({ admin: req.user._id, action: "fraud.close", target: flag.type, note: flag.note });
  res.json({ ok: true, message: "Flag closed." });
});

router.get("/videos", requireDuty("content"), async (_req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 }).lean();
  res.json({
    ok: true,
    videos: videos.map((row) => ({
      id: row._id,
      title: row.title,
      url: row.url,
      durationSeconds: row.durationSeconds,
      views: row.views,
      category: row.category || "Promo",
      reward: Number(row.reward) || 0,
      active: row.active,
    })),
  });
});

router.post("/videos", requireDuty("content"), async (req, res) => {
  const url = String(req.body?.url || "").trim();
  const parsed = parsePlayableUrl(url);
  if (!parsed) return res.status(400).json({ ok: false, message: "Paste a YouTube, Vimeo, or direct MP4/WebM link." });
  const title = String(req.body?.title || "").trim() || taskTitleFrom(parsed);
  const video = await Video.create({ title, url, category: "Task", reward: 0, durationSeconds: 0 });
  await publishTaskVideo(video);
  await AuditLog.create({ admin: req.user._id, action: "video.create", target: video.title, note: url });
  res.json({ ok: true, message: "Today's task video is set. Members watch the full video to unlock their plan ROI." });
});

router.put("/videos/:id", requireDuty("content"), async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ ok: false, message: "Video not found." });
  const body = req.body || {};
  if (typeof body.title === "string" && body.title.trim()) video.title = body.title.trim();
  if (typeof body.url === "string" && body.url.trim()) video.url = body.url.trim();
  if (typeof body.category === "string" && body.category.trim()) video.category = body.category.trim();
  if (body.reward != null && body.reward !== "") {
    const reward = Number(body.reward);
    if (!Number.isFinite(reward) || reward < 0) return res.status(400).json({ ok: false, message: "Reward must be 0 or more." });
    video.reward = reward;
  }
  if (body.durationSeconds != null && body.durationSeconds !== "") {
    const duration = Number(body.durationSeconds);
    if (!Number.isFinite(duration) || duration < 1) return res.status(400).json({ ok: false, message: "Duration must be at least 1 second." });
    video.durationSeconds = duration;
  }
  if (typeof body.active === "boolean") video.active = body.active;
  await video.save();
  await AuditLog.create({ admin: req.user._id, action: "video.update", target: video.title, note: video.active ? "Published" : "Hidden" });
  res.json({ ok: true, message: "Video saved." });
});

router.post("/videos/:id/use", requireDuty("content"), async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ ok: false, message: "Video not found." });
  if (!parsePlayableUrl(video.url)) {
    return res.status(400).json({ ok: false, message: "Use a YouTube, Vimeo, or direct MP4/WebM link. Image links cannot play in the daily task." });
  }
  await publishTaskVideo(video);
  await AuditLog.create({ admin: req.user._id, action: "video.publish", target: video.title, note: "Today's task now uses this video." });
  res.json({ ok: true, message: "Today's task video is set. Members watch the full video to unlock their plan ROI." });
});

async function publishTaskVideo(video) {
  const settings = await getSettings();
  settings.taskTitle = video.title;
  settings.taskSubtitle = "Watch the full video";
  settings.taskVideoUrl = video.url;
  settings.taskDuration = 0;
  settings.taskPublished = true;
  await settings.save();
}

function taskTitleFrom(parsed) {
  if (parsed.kind === "youtube") return `YouTube ${parsed.id}`;
  if (parsed.kind === "vimeo") return `Vimeo ${parsed.id}`;
  return "Daily task video";
}

router.get("/pages", requireDuty("content"), async (_req, res) => {
  const pages = await CmsPage.find().sort({ slug: 1 }).lean();
  res.json({
    ok: true,
    pages: pages.map((page) => ({ id: page._id, slug: page.slug, title: page.title, body: (page.body || []).join("\n\n") })),
  });
});

router.put("/pages/:slug", requireDuty("content"), async (req, res) => {
  const page = await CmsPage.findOne({ slug: req.params.slug });
  if (!page) return res.status(404).json({ ok: false, message: "Page not found." });
  const title = String(req.body?.title || "").trim();
  const body = String(req.body?.body || "").trim();
  if (title.length < 2 || body.length < 2) return res.status(400).json({ ok: false, message: "Title and body are required." });
  page.title = title;
  page.body = body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  await page.save();
  await AuditLog.create({ admin: req.user._id, action: "cms.update", target: page.slug, note: page.title });
  res.json({ ok: true, message: "Page saved." });
});

router.post("/broadcast", requireDuty("outbox"), async (req, res) => {
  const title = String(req.body?.title || "").trim();
  const body = String(req.body?.body || "").trim();
  const audience = req.body?.audience === "active" ? "active" : "all";
  if (title.length < 2 || body.length < 2) return res.status(400).json({ ok: false, message: "Title and message are required." });
  const users = await User.find({ role: { $ne: "admin" }, active: { $ne: false } }).select("email mobile fullName");
  let count = 0;
  for (const user of users) {
    if (audience === "active") {
      const account = await Account.findOne({ user: user._id }).select("subscription.active");
      if (!account?.subscription?.active) continue;
    }
    await notifyUser(user, { title, body, kind: "info" });
    count += 1;
  }
  await AuditLog.create({ admin: req.user._id, action: "broadcast", target: audience, note: `${title} · ${count} members` });
  res.json({ ok: true, message: `Broadcast queued for ${count} members. In-app is delivered. Email, SMS and push stay in the demo queue.` });
});

router.get("/outbox", requireDuty("outbox"), async (_req, res) => {
  const rows = await Outbox.find().sort({ createdAt: -1 }).limit(40).lean();
  res.json({
    ok: true,
    messages: rows.map((row) => ({
      id: row._id,
      channel: row.channel,
      to: row.to,
      title: row.title,
      status: row.status,
      at: row.createdAt,
    })),
  });
});

function presentTicket(row) {
  return {
    id: row._id,
    subject: row.subject,
    status: row.status,
    member: row.user?.fullName || "Member",
    referralId: row.user?.referralId || "",
    assigneeName: row.assigneeName || "",
    updated: row.updatedAt,
    messages: row.messages || [],
  };
}

export default router;
