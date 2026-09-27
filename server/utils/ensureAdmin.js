import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Account, { defaultDailyTask } from "../models/Account.js";
import CmsPage from "../models/CmsPage.js";
import Video from "../models/Video.js";
import Ticket from "../models/Ticket.js";
import { CMS_DEFAULTS } from "./cmsDefaults.js";
import { ensurePlans } from "./planCatalog.js";

const EXTRA_ADMINS = [
  "finance@addflix.demo",
  "content@addflix.demo",
  "support@addflix.demo",
  "operations@addflix.demo",
];

export async function ensureAdmin() {
  const email = "admin@addflix.demo";
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      fullName: "ADD FLIX Admin",
      mobile: "+91 9000000002",
      email,
      username: "admin",
      passwordHash: await bcrypt.hash("Password@123", 10),
      sponsorId: "",
      referralId: "ADD0001",
      role: "admin",
      adminRole: "super",
      country: "India",
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      transactionPin: "123456",
      active: true,
    });
  } else {
    let changed = false;
    if (user.role !== "admin") {
      user.role = "admin";
      changed = true;
    }
    if (user.adminRole !== "super") {
      user.adminRole = "super";
      changed = true;
    }
    if (changed) await user.save();
  }
  await removeExtraAdmins(user);
  await ensureCms();
  await ensureVideo();
  await ensurePlans();
  const account = await Account.findOne({ user: user._id });
  if (!account) {
    await Account.create({ user: user._id, dailyTask: defaultDailyTask(), investments: [] });
  }
  return user;
}

async function removeExtraAdmins(admin) {
  const extras = await User.find({ email: { $in: EXTRA_ADMINS } }).select("_id");
  if (!extras.length) return;
  const ids = extras.map((row) => row._id);
  await Ticket.updateMany(
    { assignee: { $in: ids } },
    { $set: { assignee: admin._id, assigneeName: admin.fullName } }
  );
  await Account.deleteMany({ user: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
}

async function ensureCms() {
  for (const page of CMS_DEFAULTS) {
    const existing = await CmsPage.findOne({ slug: page.slug });
    if (!existing) await CmsPage.create(page);
  }
}

async function ensureVideo() {
  const count = await Video.countDocuments();
  if (count) return;
  await Video.create({
    title: "Watch Sponsored Video",
    url: "/images/task-video.png",
    durationSeconds: 120,
    views: 0,
    active: true,
  });
}
