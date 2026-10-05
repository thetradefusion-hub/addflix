import Account from "../models/Account.js";
import User from "../models/User.js";
import { readSettings, referralRatesFrom } from "./settings.js";

const MAX_LEVEL = 4;

async function downline(rootCode) {
  const [root] = await User.aggregate([
    { $match: { referralId: rootCode } },
    { $limit: 1 },
    {
      $graphLookup: {
        from: User.collection.name,
        startWith: "$referralId",
        connectFromField: "referralId",
        connectToField: "sponsorId",
        as: "team",
        maxDepth: MAX_LEVEL - 1,
        depthField: "depth",
        restrictSearchWithMatch: { role: { $ne: "admin" } },
      },
    },
    { $project: { team: { _id: 1, fullName: 1, referralId: 1, sponsorId: 1, createdAt: 1, active: 1, depth: 1 } } },
  ]);
  return (root?.team || [])
    .map((member) => ({ member, level: member.depth + 1, parent: String(member.sponsorId || "").toUpperCase() }))
    .sort((a, b) => a.level - b.level || new Date(a.member.createdAt) - new Date(b.member.createdAt));
}

export async function buildNetwork(user) {
  const rootCode = String(user.referralId || "").trim().toUpperCase();
  const [items, settings] = await Promise.all([rootCode ? downline(rootCode) : [], readSettings()]);
  const accounts = items.length
    ? await Account.find({ user: { $in: items.map((item) => item.member._id) } })
      .select("user subscription.active investments.status investments.planName investments.amount")
      .lean()
    : [];
  const accountByUser = new Map(accounts.map((row) => [String(row.user), row]));

  const flat = items.map((item) => {
    const account = accountByUser.get(String(item.member._id));
    const plan = (account?.investments || []).find((row) => row.status === "Active");
    const status = item.member.active === false ? "Blocked" : account?.subscription?.active ? "Active" : "Inactive";
    return {
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
    };
  });

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
