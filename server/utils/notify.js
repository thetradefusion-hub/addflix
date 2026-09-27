import Account from "../models/Account.js";
import Outbox from "../models/Outbox.js";

export async function notifyUser(user, { title, body, kind = "info" }) {
  if (!user?._id) return;
  const account = await Account.findOne({ user: user._id });
  if (account) {
    if (!Array.isArray(account.notifications)) account.notifications = [];
    account.notifications.unshift({
      id: Date.now(),
      title,
      body,
      kind,
      unread: true,
      time: new Date().toISOString(),
    });
    account.notifications = account.notifications.slice(0, 40);
    account.markModified("notifications");
    await account.save();
  }
  const email = user.email || "";
  const mobile = user.mobile || "";
  await Outbox.insertMany([
    { channel: "in-app", to: email, title, body, status: "Delivered" },
    { channel: "email", to: email, title, body, status: "Demo queued" },
    { channel: "sms", to: mobile, title, body, status: "Demo queued" },
    { channel: "push", to: email, title, body, status: "Demo queued" },
  ]);
}
