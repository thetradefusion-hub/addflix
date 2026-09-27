import LoginSession from "../models/LoginSession.js";
import FraudFlag from "../models/FraudFlag.js";
import User from "../models/User.js";

export async function noteSharedDevice(user, deviceId) {
  const id = String(deviceId || "").trim();
  if (id.length < 8) return;
  const others = await LoginSession.find({ deviceId: id, user: { $ne: user._id } }).select("user").limit(8).lean();
  if (!others.length) return;
  const ids = [...new Set([String(user._id), ...others.map((row) => String(row.user))])];
  const open = await FraudFlag.findOne({ type: "duplicate-device", deviceId: id, status: "Open" });
  if (open) {
    open.users = ids;
    open.hits += 1;
    await open.save();
    return;
  }
  await FraudFlag.create({
    type: "duplicate-device",
    deviceId: id,
    users: ids,
    note: "The same browser device signed into more than one account.",
  });
}

export async function flagSkip(user, note) {
  const open = await FraudFlag.findOne({ type: "skip-seek", user: user._id, status: "Open" });
  if (open) {
    open.hits += 1;
    open.note = note;
    await open.save();
    return;
  }
  await FraudFlag.create({
    type: "skip-seek",
    user: user._id,
    users: [String(user._id)],
    note,
  });
}

export async function presentFlags(rows) {
  const ids = [...new Set(rows.flatMap((row) => (row.users || []).map(String)))];
  const users = await User.find({ _id: { $in: ids } }).select("fullName referralId").lean();
  const names = new Map(users.map((user) => [String(user._id), `${user.fullName} · ${user.referralId}`]));
  return rows.map((row) => ({
    id: row._id,
    type: row.type,
    status: row.status,
    note: row.note,
    hits: row.hits,
    deviceId: row.deviceId ? `${row.deviceId.slice(0, 8)}…` : "",
    accounts: (row.users || []).map((id) => names.get(String(id)) || String(id)),
    createdAt: row.createdAt,
  }));
}
