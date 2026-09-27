import Account from "../models/Account.js";
import User from "../models/User.js";
import { getSettings, referralRatesFrom } from "./settings.js";

export async function buildNetwork(user) {
  const [members, accounts, settings] = await Promise.all([
    User.find({ role: { $ne: "admin" } }).select("fullName referralId sponsorId createdAt active").lean(),
    Account.find().select("user subscription investments").lean(),
    getSettings(),
  ]);
  const accountByUser = new Map(accounts.map((row) => [String(row.user), row]));
  const children = new Map();
  for (const member of members) {
    const parent = String(member.sponsorId || "").trim().toUpperCase();
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(member);
  }

  const flat = [];
  let frontier = (children.get(String(user.referralId || "").toUpperCase()) || []).map((member) => ({
    member,
    level: 1,
    parent: String(user.referralId || "").toUpperCase(),
  }));
  while (frontier.length) {
    const next = [];
    for (const item of frontier) {
      if (item.level > 4) continue;
      const account = accountByUser.get(String(item.member._id));
      const plan = (account?.investments || []).find((row) => row.status === "Active");
      const status = item.member.active === false ? "Blocked" : account?.subscription?.active ? "Active" : "Inactive";
      flat.push({
        id: item.member.referralId,
        name: item.member.fullName,
        parent: item.parent,
        level: item.level,
        status,
        plan: plan?.planName || "—",
        investment: Number(plan?.amount) || 0,
        joined: new Date(item.member.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        sponsor: item.parent,
        tasks: 0,
      });
      const code = String(item.member.referralId || "").toUpperCase();
      for (const child of children.get(code) || []) {
        next.push({ member: child, level: item.level + 1, parent: code });
      }
    }
    frontier = next;
  }

  const levels = referralRatesFrom(settings).map((rate) => {
    const rows = flat.filter((row) => row.level === rate.level);
    return {
      level: rate.level,
      label: rate.level === 1 ? "Level 1 (Direct)" : `Level ${rate.level}`,
      amount: rate.amount,
      members: rows.length,
      active: rows.filter((row) => row.status === "Active").length,
    };
  });

  return {
    members: flat,
    levels,
    total: flat.length,
    active: flat.filter((row) => row.status === "Active").length,
    direct: flat.filter((row) => row.level === 1).length,
    commissionPerTen: levels.reduce((sum, row) => sum + Number(row.amount || 0), 0),
  };
}
