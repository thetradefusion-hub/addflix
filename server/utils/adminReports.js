import Account from "../models/Account.js";
import User from "../models/User.js";

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const IST_OFFSET_MS = 330 * 60 * 1000;
const ROW_CAP = 5000;

export const reportCatalog = [
  { id: "members", title: "Members", detail: "Every member, subscription status and wallet.", dated: true },
  { id: "wallets", title: "Wallet balances", detail: "Current USDT split across ROI, referral, bonus and locked.", dated: false },
  { id: "activity", title: "Wallet activity", detail: "Credits, debits and admin adjustments on each wallet.", dated: true },
  { id: "deposits", title: "Deposits", detail: "USDT received, network, hash and review status.", dated: true },
  { id: "withdrawals", title: "Withdrawals", detail: "Payout requests with fee, net amount and status.", dated: true },
  { id: "subscriptions", title: "Subscriptions", detail: "ID activation payments and whether they were approved.", dated: true },
  { id: "investments", title: "Investments", detail: "Plans bought, daily ROI, amount earned and cap.", dated: true },
  { id: "income", title: "Income ledger", detail: "ROI, referral, level and bonus credits.", dated: true },
  { id: "level", title: "Level income", detail: "Level 1–15 commission paid on claimed ROI.", dated: true },
  { id: "referrals", title: "Referral income", detail: "Subscription commission credited by level.", dated: true },
  { id: "tasks", title: "Daily tasks", detail: "Completed watch tasks and whether ROI was ready to claim.", dated: true },
];

function money(value, digits = 2) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Number(amount.toFixed(digits)) : 0;
}

export function parseWhen(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const iso = new Date(text);
    return Number.isNaN(iso.getTime()) ? null : iso;
  }
  const match = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (!match || MONTHS[match[2].toLowerCase()] == null) return null;
  let hour = match[4] ? Number(match[4]) : 0;
  const minute = match[5] ? Number(match[5]) : 0;
  const ampm = (match[6] || "").toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  const utc = Date.UTC(Number(match[3]), MONTHS[match[2].toLowerCase()], Number(match[1]), hour, minute) - IST_OFFSET_MS;
  return new Date(utc);
}

function bounds(from, to) {
  const start = /^\d{4}-\d{2}-\d{2}$/.test(from || "") ? new Date(`${from}T00:00:00.000+05:30`) : null;
  const end = /^\d{4}-\d{2}-\d{2}$/.test(to || "") ? new Date(`${to}T23:59:59.999+05:30`) : null;
  return {
    start: start && !Number.isNaN(start.getTime()) ? start : null,
    end: end && !Number.isNaN(end.getTime()) ? end : null,
  };
}

function within(value, window) {
  if (!window.start && !window.end) return true;
  const date = parseWhen(value);
  if (!date) return false;
  if (window.start && date < window.start) return false;
  if (window.end && date > window.end) return false;
  return true;
}

function who(user) {
  return {
    member: user?.fullName || "Member",
    memberId: user?.referralId || "",
  };
}

function byNewest(rows) {
  return rows.sort((a, b) => String(b.sortAt || "").localeCompare(String(a.sortAt || "")));
}

async function loadMembers() {
  const users = await User.find({ role: { $ne: "admin" } })
    .select("fullName email mobile referralId sponsorId createdAt active")
    .lean();
  const accounts = await Account.find({ user: { $in: users.map((user) => user._id) } })
    .select("user balances deposits withdrawals transactions income referralCredits levelCredits investments subscriptionPayments subscription tasks")
    .lean();
  const byUser = new Map(accounts.map((account) => [String(account.user), account]));
  return users.map((user) => ({ user, account: byUser.get(String(user._id)) || {} }));
}

function buildMembers(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    { key: "sponsor", label: "Sponsor" },
    { key: "joined", label: "Joined" },
    { key: "status", label: "Status" },
    { key: "subscription", label: "Subscription" },
    { key: "wallet", label: "Wallet", format: "money" },
  ];
  const rows = [];
  for (const { user, account } of pairs) {
    if (!within(user.createdAt, window)) continue;
    rows.push({
      ...who(user),
      email: user.email || "",
      mobile: user.mobile || "",
      sponsor: user.sponsorId || "",
      joined: user.createdAt ? new Date(user.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "",
      status: user.active === false ? "Blocked" : "Active",
      subscription: account.subscription?.active ? "Active" : "Inactive",
      wallet: money(account.balances?.total),
      sortAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
    });
  }
  const list = byNewest(rows);
  const wallet = list.reduce((sum, row) => sum + row.wallet, 0);
  return {
    columns,
    rows: list,
    summary: [
      { label: "Members", value: String(list.length) },
      { label: "Active IDs", value: String(list.filter((row) => row.subscription === "Active").length) },
      { label: "Blocked", value: String(list.filter((row) => row.status === "Blocked").length) },
      { label: "Wallets", value: wallet },
    ],
  };
}

function buildWallets(pairs) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "total", label: "Total", format: "money" },
    { key: "roi", label: "ROI", format: "money" },
    { key: "referral", label: "Referral", format: "money" },
    { key: "bonus", label: "Bonus", format: "money" },
    { key: "locked", label: "Locked", format: "money" },
    { key: "available", label: "Available", format: "money" },
  ];
  const rows = pairs.map(({ user, account }) => {
    const balances = account.balances || {};
    const total = money(balances.total);
    const locked = money(balances.locked);
    return {
      ...who(user),
      total,
      roi: money(balances.roi),
      referral: money(balances.referral),
      bonus: money(balances.bonus),
      locked,
      available: money(Math.max(0, total - locked)),
    };
  }).sort((a, b) => b.total - a.total);
  const sum = (key) => money(rows.reduce((total, row) => total + row[key], 0));
  return {
    columns,
    rows,
    summary: [
      { label: "Members", value: String(rows.length) },
      { label: "Total", value: sum("total") },
      { label: "Available", value: sum("available") },
      { label: "Locked", value: sum("locked") },
    ],
  };
}

function pushLines(pairs, window, field, mapRow) {
  const rows = [];
  for (const { user, account } of pairs) {
    for (const row of account[field] || []) {
      const when = row.at || row.date || row.submittedAt || row.startDate;
      if (!within(when, window)) continue;
      const parsed = parseWhen(when);
      rows.push({
        ...who(user),
        ...mapRow(row),
        sortAt: parsed ? parsed.toISOString() : String(when || ""),
      });
    }
  }
  return byNewest(rows);
}

function buildActivity(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "type", label: "Type" },
    { key: "direction", label: "Direction" },
    { key: "amount", label: "Amount", format: "money" },
    { key: "status", label: "Status" },
    { key: "note", label: "Note" },
    { key: "date", label: "Date" },
  ];
  const rows = pushLines(pairs, window, "transactions", (row) => ({
    type: row.type || "",
    direction: row.direction || "",
    amount: money(row.amount),
    status: row.status || "",
    note: row.description || "",
    date: row.date || "",
  }));
  return {
    columns,
    rows,
    summary: [
      { label: "Rows", value: String(rows.length) },
      { label: "Credits", value: money(rows.filter((row) => row.direction !== "debit").reduce((sum, row) => sum + row.amount, 0)) },
      { label: "Debits", value: money(rows.filter((row) => row.direction === "debit").reduce((sum, row) => sum + Math.abs(row.amount), 0)) },
    ],
  };
}

function buildDeposits(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "amount", label: "Amount", format: "money" },
    { key: "network", label: "Network" },
    { key: "tx", label: "Transaction" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ];
  const rows = pushLines(pairs, window, "deposits", (row) => ({
    amount: money(row.amount),
    network: row.network || "BEP-20",
    tx: row.tx || "",
    status: row.status || "",
    date: row.date || "",
  }));
  return {
    columns,
    rows,
    summary: [
      { label: "Rows", value: String(rows.length) },
      { label: "Pending", value: String(rows.filter((row) => row.status === "Pending").length) },
      { label: "Credited", value: money(rows.filter((row) => row.status === "Success").reduce((sum, row) => sum + row.amount, 0)) },
    ],
  };
}

function buildWithdrawals(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "amount", label: "Amount", format: "money" },
    { key: "fee", label: "Fee", format: "money" },
    { key: "receive", label: "Receive", format: "money" },
    { key: "address", label: "Address" },
    { key: "status", label: "Status" },
    { key: "tx", label: "Transaction" },
    { key: "date", label: "Date" },
  ];
  const rows = pushLines(pairs, window, "withdrawals", (row) => ({
    amount: money(row.amount),
    fee: money(row.fee),
    receive: money(row.receive),
    address: row.address || "",
    status: row.status || "",
    tx: row.tx || "",
    date: row.date || "",
  }));
  return {
    columns,
    rows,
    summary: [
      { label: "Rows", value: String(rows.length) },
      { label: "Pending", value: String(rows.filter((row) => row.status === "Pending" || row.status === "Processing").length) },
      { label: "Paid", value: money(rows.filter((row) => row.status === "Completed" || row.status === "Success").reduce((sum, row) => sum + row.amount, 0)) },
    ],
  };
}

function buildSubscriptions(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "email", label: "Email" },
    { key: "amount", label: "Amount", format: "money" },
    { key: "network", label: "Network" },
    { key: "tx", label: "Transaction" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ];
  const rows = [];
  for (const { user, account } of pairs) {
    for (const row of account.subscriptionPayments || []) {
      const when = row.submittedAt || row.date;
      if (!within(when, window)) continue;
      const parsed = parseWhen(when);
      rows.push({
        ...who(user),
        email: user.email || "",
        amount: money(row.amount),
        network: row.network || "BEP-20",
        tx: row.txHash || row.tx || "",
        status: row.status || "",
        date: when || "",
        sortAt: parsed ? parsed.toISOString() : String(when || ""),
      });
    }
  }
  const list = byNewest(rows);
  return {
    columns,
    rows: list,
    summary: [
      { label: "Rows", value: String(list.length) },
      { label: "Pending", value: String(list.filter((row) => row.status === "Pending").length) },
      { label: "Approved", value: money(list.filter((row) => String(row.status).toLowerCase() === "success").reduce((sum, row) => sum + row.amount, 0)) },
    ],
  };
}

function buildInvestments(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Amount", format: "money" },
    { key: "daily", label: "Daily ROI", format: "money" },
    { key: "earned", label: "Earned", format: "money" },
    { key: "cap", label: "Cap", format: "money" },
    { key: "status", label: "Status" },
    { key: "started", label: "Started" },
  ];
  const rows = pushLines(pairs, window, "investments", (row) => ({
    plan: row.planName || "",
    amount: money(row.amount),
    daily: money(row.dailyAmount),
    earned: money(row.earnedRoi),
    cap: money(row.cap),
    status: row.status || "",
    started: row.startDate || "",
    date: row.startDate || "",
  }));
  return {
    columns,
    rows,
    summary: [
      { label: "Plans", value: String(rows.length) },
      { label: "Active", value: String(rows.filter((row) => row.status === "Active").length) },
      { label: "Invested", value: money(rows.reduce((sum, row) => sum + row.amount, 0)) },
      { label: "ROI earned", value: money(rows.reduce((sum, row) => sum + row.earned, 0)) },
    ],
  };
}

function buildIncome(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", format: "money4" },
    { key: "status", label: "Status" },
    { key: "tx", label: "Reference" },
    { key: "date", label: "Date" },
  ];
  const rows = pushLines(pairs, window, "income", (row) => ({
    type: row.type || "",
    description: row.description || "",
    amount: money(row.amount, 4),
    status: row.status || "",
    tx: row.tx || "",
    date: row.date || "",
  }));
  const sumType = (type) => money(rows.filter((row) => row.type === type).reduce((sum, row) => sum + row.amount, 0), 4);
  return {
    columns,
    rows,
    summary: [
      { label: "Rows", value: String(rows.length) },
      { label: "ROI", value: sumType("ROI Income") },
      { label: "Referral", value: sumType("Referral Income") },
      { label: "Level", value: sumType("Level Income") },
      { label: "Bonus", value: sumType("Bonus Income") },
    ],
  };
}

function buildLevel(pairs, window) {
  const columns = [
    { key: "member", label: "Receiver" },
    { key: "memberId", label: "Receiver ID" },
    { key: "from", label: "From" },
    { key: "fromId", label: "From ID" },
    { key: "level", label: "Level" },
    { key: "rate", label: "Rate %" },
    { key: "roi", label: "ROI base", format: "money" },
    { key: "commission", label: "Commission", format: "money4" },
    { key: "date", label: "Date" },
  ];
  const rows = pushLines(pairs, window, "levelCredits", (row) => ({
    from: row.name || "",
    fromId: row.user || "",
    level: row.level || "",
    rate: row.rate ?? "",
    roi: money(row.roi),
    commission: money(row.commission, 4),
    date: row.date || "",
  }));
  return {
    columns,
    rows,
    summary: [
      { label: "Credits", value: String(rows.length) },
      { label: "Commission", value: money(rows.reduce((sum, row) => sum + row.commission, 0), 4) },
      { label: "Receivers", value: String(new Set(rows.map((row) => row.memberId)).size) },
    ],
  };
}

function buildReferrals(pairs, window) {
  const columns = [
    { key: "member", label: "Receiver" },
    { key: "memberId", label: "Receiver ID" },
    { key: "from", label: "From" },
    { key: "fromId", label: "From ID" },
    { key: "level", label: "Level" },
    { key: "amount", label: "Subscription", format: "money" },
    { key: "commission", label: "Commission", format: "money" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ];
  const rows = pushLines(pairs, window, "referralCredits", (row) => ({
    from: row.name || "",
    fromId: row.user || "",
    level: row.level || "",
    amount: money(row.amount),
    commission: money(row.commission),
    status: row.status || "",
    date: row.date || "",
  }));
  return {
    columns,
    rows,
    summary: [
      { label: "Credits", value: String(rows.length) },
      { label: "Commission", value: money(rows.reduce((sum, row) => sum + row.commission, 0)) },
      { label: "Receivers", value: String(new Set(rows.map((row) => row.memberId)).size) },
    ],
  };
}

function buildTasks(pairs, window) {
  const columns = [
    { key: "member", label: "Member" },
    { key: "memberId", label: "Member ID" },
    { key: "title", label: "Task" },
    { key: "completion", label: "Completion" },
    { key: "roi", label: "ROI", format: "money" },
    { key: "claim", label: "Claim" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ];
  const rows = pushLines(pairs, window, "tasks", (row) => ({
    title: row.title || "",
    completion: row.completion || "",
    roi: money(row.roi),
    claim: row.claim || "",
    status: row.status || "",
    date: row.date || "",
  }));
  return {
    columns,
    rows,
    summary: [
      { label: "Tasks", value: String(rows.length) },
      { label: "Completed", value: String(rows.filter((row) => row.status === "Completed").length) },
      { label: "ROI shown", value: money(rows.reduce((sum, row) => sum + row.roi, 0)) },
    ],
  };
}

const builders = {
  members: buildMembers,
  wallets: (pairs) => buildWallets(pairs),
  activity: buildActivity,
  deposits: buildDeposits,
  withdrawals: buildWithdrawals,
  subscriptions: buildSubscriptions,
  investments: buildInvestments,
  income: buildIncome,
  level: buildLevel,
  referrals: buildReferrals,
  tasks: buildTasks,
};

export async function buildAdminReport(type, { from, to } = {}) {
  const meta = reportCatalog.find((item) => item.id === type);
  if (!meta) return null;
  const window = meta.dated ? bounds(from, to) : { start: null, end: null };
  const built = builders[type](await loadMembers(), window);
  const truncated = built.rows.length > ROW_CAP;
  return {
    ...meta,
    columns: built.columns,
    rows: built.rows.slice(0, ROW_CAP).map(({ sortAt, ...row }) => row),
    summary: built.summary,
    truncated,
    from: window.start ? from : "",
    to: window.end ? to : "",
  };
}
