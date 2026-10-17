/**
 * Wipe all member data. Keep only:
 * - admin@addflix.demo (admin)
 * - username `addflix` as a fresh empty member (root sponsor)
 */
import bcrypt from "bcryptjs";
import { connectDb } from "../server/config/db.js";
import User from "../server/models/User.js";
import Account, { defaultDailyTask } from "../server/models/Account.js";
import LoginSession from "../server/models/LoginSession.js";
import Ticket from "../server/models/Ticket.js";
import FraudFlag from "../server/models/FraudFlag.js";
import AuditLog from "../server/models/AuditLog.js";
import Outbox from "../server/models/Outbox.js";
import { ensureAdmin } from "../server/utils/ensureAdmin.js";

const DEMO_PASSWORD = "Password@123";

async function main() {
  await connectDb();
  const admin = await ensureAdmin();

  const keepUsernames = new Set(["admin", "addflix"]);
  const keepEmails = new Set(["admin@addflix.demo", "platform@addflix.demo"]);

  const doomed = await User.find({
    $and: [
      { _id: { $ne: admin._id } },
      { username: { $nin: [...keepUsernames] } },
      { email: { $nin: [...keepEmails] } },
      { role: { $ne: "admin" } },
    ],
  }).select("_id username email referralId");

  // Also remove any other admins except the primary
  const extraAdmins = await User.find({
    role: "admin",
    _id: { $ne: admin._id },
  }).select("_id username email");

  const removeIds = [...doomed, ...extraAdmins].map((row) => row._id);
  console.log(`Removing ${doomed.length} members + ${extraAdmins.length} extra admins…`);

  if (removeIds.length) {
    await Promise.all([
      Account.deleteMany({ user: { $in: removeIds } }),
      LoginSession.deleteMany({ user: { $in: removeIds } }),
      Ticket.deleteMany({ user: { $in: removeIds } }),
      FraudFlag.deleteMany({ $or: [{ user: { $in: removeIds } }, { users: { $in: removeIds.map(String) } }] }),
      Outbox.deleteMany({}),
      User.deleteMany({ _id: { $in: removeIds } }),
    ]);
  }

  // Fresh addflix root member
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let addflix = await User.findOne({ username: "addflix" });
  if (!addflix) {
    addflix = await User.create({
      fullName: "ADD FLIX",
      mobile: "+91 9000000001",
      email: "platform@addflix.demo",
      username: "addflix",
      passwordHash,
      passwordPlain: DEMO_PASSWORD,
      sponsorId: "",
      referralId: "ADD1000",
      country: "India",
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      twoFactorEnabled: false,
      transactionPin: "000000",
      role: "member",
      active: true,
    });
    console.log("Created fresh addflix user");
  } else {
    addflix.fullName = "ADD FLIX";
    addflix.mobile = "+91 9000000001";
    addflix.email = "platform@addflix.demo";
    addflix.passwordHash = passwordHash;
    addflix.passwordPlain = DEMO_PASSWORD;
    addflix.sponsorId = "";
    addflix.referralId = "ADD1000";
    addflix.country = "India";
    addflix.otpVerified = true;
    addflix.termsAccepted = true;
    addflix.privacyAccepted = true;
    addflix.twoFactorEnabled = false;
    addflix.transactionPin = "000000";
    addflix.role = "member";
    addflix.adminRole = "";
    addflix.active = true;
    addflix.resetToken = null;
    await addflix.save();
    console.log("Reset existing addflix user");
  }

  await Account.deleteMany({ user: addflix._id });
  await Account.create({
    user: addflix._id,
    dailyTask: defaultDailyTask(),
    investments: [],
    balances: { total: 0, roi: 0, referral: 0, bonus: 0, locked: 0 },
    subscription: { active: false, paymentState: "idle", txHash: "", amount: 10, network: "BEP-20" },
    income: [],
    transactions: [],
    deposits: [],
    withdrawals: [],
    notifications: [],
    tasks: [],
    roiDays: [],
    subscriptionPayments: [],
    videoWatches: [],
    referralCredits: [],
    levelCredits: [],
    signupWithdraw: { remaining: 0, withdrawn: 0 },
  });
  await LoginSession.deleteMany({ user: addflix._id });

  // Keep admin audit trail light: drop member-facing audit noise optional
  await AuditLog.deleteMany({
    admin: { $ne: admin._id },
  });

  const left = await User.find().select("username email role referralId").lean();
  const accounts = await Account.countDocuments();
  console.log("Remaining users:");
  for (const row of left) {
    console.log(`  - ${row.username} · ${row.email} · ${row.role} · ${row.referralId}`);
  }
  console.log(`Accounts: ${accounts}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
