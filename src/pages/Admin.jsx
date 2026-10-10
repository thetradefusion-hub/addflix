import { useEffect, useState } from "react";
import { NavLink, Navigate, useLocation, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { apiFetch, clearAdminSession, readAdminSession } from "@/lib/api";
import { activationLabel, fineMoney, money, shortHash } from "@/lib/utils";
import { formatLedgerDate } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import PageHeader from "@/components/common/PageHeader";
import Pager, { usePaging } from "@/components/common/Pager";
import StatCard from "@/components/common/StatCard";
import AppIcon from "@/components/common/AppIcon";
import AdminShell from "@/components/layout/AdminShell";
import AdminLogin from "@/pages/AdminLogin";
import AdminDesk from "@/pages/AdminDesk";
import AdminReports from "@/pages/AdminReports";

const card = "rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]";

const pageMeta = {
  overview: ["Overview", "Users, subscribers, tasks and payouts at a glance."],
  users: ["Users", "Search members, then open a profile for wallet, task, payments and activity."],
  user: ["Member", "Profile, balances, subscription, today's task, plans and recent activity."],
  withdrawals: ["Withdrawals", "Approve a payout with a transaction hash, or reject and unlock."],
  deposits: ["Deposits", "Mark a pending deposit success to credit the wallet, or failed."],
  tickets: ["Tickets", "Reply to members and close resolved requests."],
  fraud: ["Fraud", "Shared devices and skip attempts. Close a flag after review."],
  videos: ["Videos", "Add a link, then choose Use today. Members watch that video on the daily task."],
  pages: ["Pages", "About, rules, FAQ and the other public pages."],
  messages: ["Messages", "Broadcast to members. In-app is delivered. Email, SMS and push stay queued."],
  audit: ["Audit", "Wallet, ROI, commission, withdrawal and admin login history."],
  level: ["Level Income", "Level 1–15 commission on claimed daily ROI. Every credit and every skipped upline is listed."],
  reports: ["Reports", "Member, wallet, payout and income statements. Export the current view to Excel or PDF."],
  settings: ["Settings", "Subscription price, deposit address, referral rates, withdrawal rules and today's task."],
  plans: ["Plans", "Daily rate, minimum, cap and whether members can buy the plan."],
  subscriptions: ["Subscriptions", "Approve a $10 payment to activate the ID, or mark it failed."],
};

const demoHash = `0x${"ab".repeat(32)}`;

export default function Admin({ view }) {
  const location = useLocation();
  const [session, setSession] = useState(() => readAdminSession());

  if (!session) {
    if (location.pathname !== "/admin") return <Navigate to="/admin" replace />;
    return <AdminLogin onSuccess={() => setSession(readAdminSession())} />;
  }

  return <AdminConsole view={view} onLogout={() => { clearAdminSession(); setSession(null); }} />;
}

function AdminConsole({ view, onLogout }) {
  const { id } = useParams();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [overview, setOverview] = useState(null);
  const [audits, setAudits] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [member, setMember] = useState(null);
  const [adjust, setAdjust] = useState({ bucket: "bonus", amount: "1", note: "", direction: "credit" });
  const [withdrawals, setWithdrawals] = useState([]);
  const [txHash, setTxHash] = useState(demoHash);
  const [deposits, setDeposits] = useState([]);
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planDraft, setPlanDraft] = useState({ planId: "", name: "", min: "100", dailyRate: "2", maxRoi: "150", validity: "75", offDays: [] });
  const [subscriptions, setSubscriptions] = useState([]);
  const [levelData, setLevelData] = useState(null);
  const [entering, setEntering] = useState("");

  const load = async () => {
    setError("");
    try {
      if (view === "overview") {
        const data = await apiFetch("/api/admin/overview");
        setOverview(data.overview);
        setAudits(data.audits || []);
      } else if (view === "users") {
        const data = await apiFetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
        setUsers(data.users || []);
      } else if (view === "user" && id) {
        const data = await apiFetch(`/api/admin/users/${id}`);
        setMember(data.user);
      } else if (view === "withdrawals") {
        const data = await apiFetch("/api/admin/withdrawals");
        setWithdrawals(data.withdrawals || []);
      } else if (view === "deposits") {
        const data = await apiFetch("/api/admin/deposits");
        setDeposits(data.deposits || []);
      } else if (view === "settings") {
        const data = await apiFetch("/api/admin/settings");
        setSettings(data.settings);
      } else if (view === "plans") {
        const data = await apiFetch("/api/admin/plans");
        setPlans(data.plans || []);
      } else if (view === "subscriptions") {
        const data = await apiFetch("/api/admin/subscriptions");
        setSubscriptions(data.subscriptions || []);
      } else if (view === "level") {
        setLevelData(await apiFetch("/api/admin/level-income"));
      }
    } catch (err) {
      if (err.status === 401 || String(err.message).includes("Admin")) {
        onLogout();
        return;
      }
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [view, id]);

  const logout = () => {
    onLogout();
  };

  const loginAs = async (userId) => {
    setError("");
    setEntering(userId);
    try {
      const data = await apiFetch(`/api/admin/users/${userId}/impersonate`, { method: "POST" });
      localStorage.setItem("addflix_token", data.token);
      localStorage.setItem("addflix_user", JSON.stringify(data.user));
      localStorage.setItem("addflix_impersonating", "1");
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err.message);
      setEntering("");
    }
  };

  const run = async (path, options, success) => {
    setError("");
    setNotice("");
    try {
      const data = await apiFetch(path, options);
      setNotice(data.message || success);
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const meta = pageMeta[view] || pageMeta.overview;
  const title = view === "user" && member?.name ? member.name : meta[0];
  const adminUser = readAdminSession()?.user;

  return (
    <AdminShell user={adminUser} onLogout={logout}>
      <div className="space-y-3">
          {view === "overview" || view === "users" || view === "withdrawals" || view === "deposits" || view === "plans" || view === "subscriptions" ? null : <PageHeader title={title} subtitle={meta[1]} crumbs={[{ label: "Admin", to: "/admin" }, { label: title }]} />}
          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          {notice ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}
          {view === "overview" && overview ? <Overview overview={overview} audits={audits} name={adminUser?.fullName || "Admin"} /> : null}
          {view === "users" ? (
            <Users
              users={users}
              query={query}
              setQuery={setQuery}
              entering={entering}
              onLoginAs={loginAs}
              onSearch={(event) => {
                event.preventDefault();
                load();
              }}
            />
          ) : null}
          {view === "user" && member ? (
            <Member
              member={member}
              adjust={adjust}
              setAdjust={setAdjust}
              entering={entering === member.id}
              onLoginAs={() => loginAs(member.id)}
              onStatus={(active) => run(`/api/admin/users/${member.id}/status`, { method: "POST", body: JSON.stringify({ active }) })}
              onAdjust={(event) => {
                event.preventDefault();
                const value = Math.abs(Number(adjust.amount));
                if (!value) {
                  setError("Enter an amount greater than 0.");
                  return;
                }
                const amount = adjust.direction === "debit" ? -value : value;
                run(`/api/admin/users/${member.id}/wallet`, { method: "POST", body: JSON.stringify({ bucket: adjust.bucket, amount, note: adjust.note }) });
              }}
            />
          ) : null}
          {view === "withdrawals" ? (
            <Withdrawals
              rows={withdrawals}
              txHash={txHash}
              setTxHash={setTxHash}
              onApprove={(rowId) => run(`/api/admin/withdrawals/${rowId}/approve`, { method: "POST", body: JSON.stringify({ txHash }) })}
              onReject={(rowId) => run(`/api/admin/withdrawals/${rowId}/reject`, { method: "POST", body: JSON.stringify({ note: "Rejected from the payout queue" }) })}
            />
          ) : null}
          {view === "deposits" ? (
            <Deposits
              rows={deposits}
              onVerify={(rowId, result) => run(`/api/admin/deposits/${rowId}/verify`, { method: "POST", body: JSON.stringify({ result }) })}
            />
          ) : null}
          {view === "reports" ? <AdminReports onSessionExpired={onLogout} /> : null}
          {["audit", "tickets", "fraud", "videos", "pages", "messages"].includes(view) ? <AdminDesk view={view} onSessionExpired={onLogout} /> : null}
          {view === "level" && levelData ? <LevelIncome data={levelData} /> : null}
          {view === "plans" ? (
            <PlansPanel
              plans={plans}
              setPlans={setPlans}
              draft={planDraft}
              setDraft={setPlanDraft}
              onCreate={async (event) => {
                event.preventDefault();
                const saved = await run("/api/admin/plans", { method: "POST", body: JSON.stringify(planDraft) });
                if (saved) setPlanDraft({ planId: "", name: "", min: "100", dailyRate: "2", maxRoi: "150", validity: "75", offDays: [] });
              }}
              onSave={(plan) => run(`/api/admin/plans/${plan.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  name: plan.name,
                  min: Number(plan.min),
                  dailyRate: Number(plan.dailyRate),
                  maxRoi: Number(plan.maxRoi),
                  validity: Number(plan.validity),
                  offDays: Array.isArray(plan.offDays) ? plan.offDays : [],
                  active: Boolean(plan.active),
                  popular: Boolean(plan.popular),
                }),
              })}
            />
          ) : null}
          {view === "subscriptions" ? (
            <Subscriptions
              rows={subscriptions}
              onReview={(rowId, result) => run(`/api/admin/subscriptions/${rowId}/review`, { method: "POST", body: JSON.stringify({ result }) })}
            />
          ) : null}
          {view === "settings" && settings ? (
            <SettingsForm
              settings={settings}
              setSettings={setSettings}
              onSave={(event) => {
                event.preventDefault();
                run("/api/admin/settings", { method: "PUT", body: JSON.stringify({ ...settings, taskPublished: Boolean(settings.taskPublished) }) });
              }}
            />
          ) : null}
      </div>
    </AdminShell>
  );
}

function Overview({ overview, audits, name }) {
  const waiting = Number(overview.pendingDeposits || 0) + Number(overview.pendingWithdrawals || 0) + Number(overview.pendingSubscriptions || 0);
  const tiles = [
    { to: "/admin/users", icon: "BadgeCheck", iconBg: "bg-emerald-50 text-emerald-600", label: "Subscribers", value: String(overview.subscribers || 0), hint: `${overview.users || 0} members` },
    { to: "/admin/users", icon: "Clapperboard", iconBg: "bg-amber-50 text-amber-600", label: "Tasks today", value: String(overview.tasksToday || 0), hint: `${overview.claimsToday || 0} ROI claimed` },
    { to: "/admin/deposits", icon: "ArrowDownToLine", iconBg: "bg-sky-50 text-sky-500", label: "Pending deposits", value: String(overview.pendingDeposits || 0), hint: "Waiting for review" },
    { to: "/admin/withdrawals", icon: "ArrowUpFromLine", iconBg: "bg-rose-50 text-rose-500", label: "Pending withdrawals", value: String(overview.pendingWithdrawals || 0), hint: "Payout queue" },
    { to: "/admin/level-income", icon: "HandCoins", iconBg: "bg-violet-50 text-violet-600", label: "Level income today", value: `$${fineMoney(overview.levelToday)}`, hint: "L1–L15 on claimed ROI" },
    { to: "/admin/level-income", icon: "Coins", iconBg: "bg-red-50 text-[#e10600]", label: "Level income paid", value: `$${fineMoney(overview.levelPaid)}`, hint: "All time" },
  ];
  const queues = [
    ["Deposits", overview.pendingDeposits, "/admin/deposits"],
    ["Withdrawals", overview.pendingWithdrawals, "/admin/withdrawals"],
    ["Subscriptions", overview.pendingSubscriptions, "/admin/subscriptions"],
  ];
  return (
    <div className="space-y-3">
      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-[#101828] sm:text-2xl">Welcome Back, {name}</h1>
          <p className="mt-0.5 text-sm text-[#667085]">Review payouts, deposits and new members.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {waiting} waiting
        </span>
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <article className="relative overflow-hidden rounded-2xl bg-[linear-gradient(125deg,#5b21b6_0%,#7c3aed_42%,#db2777_100%)] p-5 text-white shadow-[0_16px_36px_rgba(91,33,182,0.28)] lg:col-span-5">
          <p className="text-sm text-white/80">Member wallets (USDT)</p>
          <p className="mt-1 text-4xl font-black tracking-tight">${money(overview.walletTotal)}</p>
          <p className="mt-1 text-sm text-white/75">{overview.subscribers || 0} active of {overview.users || 0} members</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <NavLink to="/admin/users" className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#e10600] px-2 text-xs font-bold sm:text-sm"><AppIcon name="Users" size={15} /> Users</NavLink>
            <NavLink to="/admin/deposits" className="theme-fixed inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-white px-2 text-xs font-bold text-[#111827] sm:text-sm"><AppIcon name="ArrowDownToLine" size={15} /> Deposits</NavLink>
            <NavLink to="/admin/withdrawals" className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#4c1d95] px-2 text-xs font-bold sm:text-sm"><AppIcon name="ArrowUpFromLine" size={15} /> Payouts</NavLink>
          </div>
        </article>
        <div className="grid grid-cols-2 gap-3 lg:col-span-7">
          {tiles.map((item) => (
            <NavLink key={item.label} to={item.to} className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#eaecf0] bg-white p-3 text-left shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.iconBg}`}><AppIcon name={item.icon} size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] leading-tight text-[#667085]">{item.label}</span>
                <span className="mt-0.5 block text-base font-black tracking-tight">{item.value}</span>
                <span className="block text-[11px] leading-tight text-[#98a2b3]">{item.hint}</span>
              </span>
              <ChevronRight size={14} className="shrink-0 text-[#d0d5dd]" />
            </NavLink>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className={card}>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Needs review</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${waiting ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-600"}`}>{waiting ? `${waiting} open` : "Clear"}</span>
          </div>
          <div className="space-y-2">
            {queues.map(([label, count, to]) => (
              <NavLink key={label} to={to} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-3 text-sm">
                <span className="font-semibold">{label}</span>
                <span className="text-[#667085]">{count || 0} pending</span>
              </NavLink>
            ))}
          </div>
        </article>
        <article className={card}>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">New members</p>
            <NavLink to="/admin/users" className="text-xs font-semibold text-[#e10600]">View all</NavLink>
          </div>
          {(overview.recentUsers || []).length === 0 ? <p className="text-sm text-[#98a2b3]">No members yet.</p> : null}
          <div className="space-y-2">
            {(overview.recentUsers || []).map((user) => (
              <NavLink key={user.id} to={`/admin/users/${user.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fafc] px-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{user.name}</span>
                  <span className="block text-[11px] text-[#98a2b3]">{user.referralId} · {user.joined}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold">${money(user.wallet)}</span>
                  <span className="text-[11px] text-[#98a2b3]">{user.subscription ? "Active" : "Inactive"}</span>
                </span>
              </NavLink>
            ))}
          </div>
        </article>
      </section>

      <article className={card}>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-bold">Recent actions</p>
          <NavLink to="/admin/audit" className="text-xs font-semibold text-[#e10600]">View all</NavLink>
        </div>
        {audits.length === 0 ? <p className="text-sm text-[#98a2b3]">No admin actions yet.</p> : null}
        <ul className="space-y-2 text-sm">
          {audits.map((row) => (
            <li key={row._id} className="flex justify-between gap-3 border-t border-[#f2f4f7] py-2">
              <span className="min-w-0 truncate">{row.action} · {row.target || "platform"}</span>
              <span className="shrink-0 text-xs text-[#98a2b3]">{row.note}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

function Users({ users, query, setQuery, onSearch, onLoginAs, entering }) {
  const [filter, setFilter] = useState("all");
  const filtered = users.filter((user) => {
    if (filter === "subscribed") return user.subscription && user.active;
    if (filter === "inactive") return !user.subscription && user.active;
    if (filter === "blocked") return !user.active;
    return true;
  });
  const list = usePaging(filtered, 8, `${query}:${filter}:${filtered.length}:${filtered[0]?.id || ""}`);
  const subscribed = users.filter((user) => user.subscription).length;
  const blocked = users.filter((user) => !user.active).length;
  const wallets = users.reduce((sum, user) => sum + Number(user.wallet || 0), 0);
  const filters = [
    ["all", "All", users.length],
    ["subscribed", "Subscribed", subscribed],
    ["inactive", "Not subscribed", users.filter((user) => !user.subscription && user.active).length],
    ["blocked", "Blocked", blocked],
  ];
  return (
    <div className="space-y-3">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-[#101828] sm:text-2xl">Members</h1>
        <p className="mt-0.5 text-sm text-[#667085]">Search a member, open the profile, or sign in as that account.</p>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Users", "Users", String(users.length), "In this list"],
          ["BadgeCheck", "Subscribed", String(subscribed), "ID active"],
          ["LockKeyhole", "Blocked", String(blocked), "Cannot sign in"],
          ["Wallet", "Wallets", `$${money(wallets)}`, "Combined balance"],
        ].map(([icon, label, value, hint]) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-[#e10600]"><AppIcon name={icon} size={18} /></span>
            <span className="min-w-0">
              <span className="block text-[11px] text-[#667085]">{label}</span>
              <span className="block truncate text-base font-black">{value}</span>
              <span className="block text-[11px] text-[#98a2b3]">{hint}</span>
            </span>
          </article>
        ))}
      </section>
      <article className={card}>
        <form onSubmit={onSearch} className="flex gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, mobile, username or ID" className="h-11 flex-1 rounded-xl border border-[#eaecf0] px-3 text-sm" />
          <Button type="submit">Search</Button>
        </form>
        <div className="mt-3 flex gap-2 overflow-auto no-scrollbar">
          {filters.map(([id, label, count]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === id ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>{label} · {count}</button>
          ))}
        </div>
        {filtered.length === 0 ? <p className="py-8 text-center text-sm text-[#98a2b3]">No members in this filter.</p> : null}
        <div className="mt-3 space-y-2">
          {list.items.map((user) => (
            <article key={user.id} className="flex flex-col gap-3 rounded-2xl border border-[#f2f4f7] bg-[#f8fafc] p-3 lg:flex-row lg:items-center">
              <NavLink to={`/admin/users/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-[#e10600] shadow-sm">{initials(user.name)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-[#101828]">{user.name}</span>
                  <span className="block truncate text-xs text-[#667085]">{user.referralId} · {user.mobile || user.email}</span>
                  <span className="block truncate text-[11px] text-[#98a2b3]">Sponsor {user.sponsorId || "—"} · Joined {user.joined || "—"}</span>
                </span>
              </NavLink>
              <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-2 text-center lg:w-96">
                <span><span className="block text-[10px] text-[#98a2b3]">Wallet</span><span className="text-sm font-black">${money(user.wallet)}</span></span>
                <span><span className="block text-[10px] text-[#98a2b3]">Plan</span><span className="block truncate text-sm font-bold">{String(user.plan || "None").replace(" Plan", "")}</span></span>
                <TodayTask task={user.todayTask} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={user.subscription ? "active" : "inactive"}>{user.subscription ? "Subscribed" : "Not subscribed"}</StatusBadge>
                {!user.active ? <StatusBadge tone="danger">Blocked</StatusBadge> : null}
                <Button type="button" size="sm" variant="outline" disabled={entering === user.id} onClick={() => onLoginAs(user.id)}>{entering === user.id ? "Opening..." : "Login as user"}</Button>
              </div>
            </article>
          ))}
        </div>
        <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
      </article>
    </div>
  );
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (letters || "M").toUpperCase();
}

function FieldList({ rows }) {
  return (
    <dl className="space-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b border-[#f2f4f7] py-1.5">
          <dt className="text-[#667085]">{label}</dt>
          <dd className="max-w-[60%] break-all text-right font-semibold">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

const taskTone = {
  claimed: "text-emerald-600",
  done: "text-sky-600",
  watching: "text-amber-600",
  not_started: "text-[#667085]",
  off: "text-violet-600",
  locked: "text-rose-600",
};

function TodayTask({ task }) {
  const state = task?.state || "not_started";
  return (
    <span className="min-w-0" title={task?.lastDay ? `Last task ${task.lastDay}: ${task.lastStatus}` : undefined}>
      <span className="block text-[10px] text-[#98a2b3]">Today's task</span>
      <span className={`block truncate text-sm font-bold ${taskTone[state] || taskTone.not_started}`}>{task?.label || "Not started"}</span>
      {state === "watching" ? (
        <span className="mx-auto mt-1 block h-1 w-16 overflow-hidden rounded-full bg-[#eaecf0]">
          <span className="block h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, task.progress || 0)}%` }} />
        </span>
      ) : task?.lastDay ? (
        <span className="block truncate text-[10px] text-[#98a2b3]">Last {task.lastDay.slice(5)} · {task.lastStatus}</span>
      ) : null}
    </span>
  );
}

function RecordList({ title, empty, rows, render, resetKey }) {
  const list = usePaging(rows, 8, resetKey);
  return (
    <article className={card}>
      <p className="font-bold">{title}</p>
      {rows.length === 0 ? <p className="mt-2 text-sm text-[#98a2b3]">{empty}</p> : <div className="mt-2 space-y-2">{list.items.map(render)}</div>}
      <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
    </article>
  );
}

function Member({ member, adjust, setAdjust, onStatus, onAdjust, onLoginAs, entering }) {
  const task = member.dailyTask || {};
  const balances = member.balances || {};
  const activePlans = (member.investments || []).filter((row) => row.status === "Active");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <NavLink to="/admin/users" className="text-sm font-semibold text-[#e10600]">All users</NavLink>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={entering} onClick={onLoginAs}>{entering ? "Opening..." : "Login as user"}</Button>
          <Button variant="outline" onClick={() => onStatus(!member.active)}>{member.active ? "Block user" : "Activate user"}</Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<AppIcon name="Wallet" size={18} />} label="Total balance" value={`$${money(balances.total)}`} hint={`Available $${money(balances.available)}`} />
        <StatCard icon={<AppIcon name="HandCoins" size={18} />} label="ROI" value={`$${money(balances.roi)}`} />
        <StatCard icon={<AppIcon name="Users" size={18} />} label="Referral" value={`$${money(balances.referral)}`} hint={`${member.directs || 0} direct`} />
        <StatCard icon={<AppIcon name="LockKeyhole" size={18} />} label="Locked" value={`$${money(balances.locked)}`} hint={`Bonus $${money(balances.bonus)}`} />
      </section>

      <form onSubmit={onAdjust} className={card}>
        <p className="font-bold">Wallet adjust</p>
        <p className="text-xs text-[#667085]">Add puts money in the selected balance. Deduct takes it out. Both are saved in the audit log.</p>
        <div className="mt-3 flex gap-2">
          {[["credit", "Add"], ["debit", "Deduct"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setAdjust({ ...adjust, direction: id })} className={`h-10 rounded-xl px-4 text-sm font-bold ${adjust.direction === id ? "bg-[#e10600] text-white" : "border border-[#eaecf0] text-[#475467]"}`}>{label}</button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs text-[#667085]">Balance
            <select value={adjust.bucket} onChange={(event) => setAdjust({ ...adjust, bucket: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm">
              <option value="roi">ROI · ${money(balances.roi)}</option>
              <option value="referral">Referral · ${money(balances.referral)}</option>
              <option value="bonus">Bonus · ${money(balances.bonus)}</option>
            </select>
          </label>
          <label className="block text-xs text-[#667085]">Amount (USDT)
            <input value={adjust.amount} onChange={(event) => setAdjust({ ...adjust, amount: event.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
          </label>
          <label className="block text-xs text-[#667085]">Note
            <input value={adjust.note} onChange={(event) => setAdjust({ ...adjust, note: event.target.value })} placeholder="Reason for this change" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
          </label>
        </div>
        <Button className="mt-3" type="submit">{adjust.direction === "debit" ? "Deduct balance" : "Add balance"}</Button>
      </form>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className={card}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-lg font-black">{member.name}</p>
            <StatusBadge tone={member.active ? "active" : "inactive"}>{member.active ? "Active" : "Blocked"}</StatusBadge>
          </div>
          <FieldList rows={[
            ["Username", member.username],
            ["Email", member.email],
            ["Mobile", member.mobile],
            ["Country", member.country],
            ["Member ID", member.referralId],
            ["Sponsor", member.sponsorName ? `${member.sponsorName} · ${member.sponsorId}` : member.sponsorId],
            ["Joined", member.joined],
            ["Last login", member.lastLogin],
            ["2FA", member.twoFactor ? "On" : "Off"],
            ["Transaction PIN", member.pinSet ? "Set" : "Not set"],
            ["Wallet address", member.walletAddress],
          ]} />
        </article>
        <article className={card}>
          <p className="mb-2 font-bold">Subscription</p>
          <FieldList rows={[
            ["Status", member.subscription?.active ? "Active" : "Not active"],
            ["Payment", member.subscription?.paymentState || "idle"],
            ["Amount", member.subscription?.amount != null ? `$${money(member.subscription.amount)} ${member.subscription.network || ""}`.trim() : ""],
            ["Activated", member.subscription?.activatedAt ? activationLabel(member.subscription.activatedAt) : ""],
            ["TX hash", member.subscription?.txHash ? shortHash(member.subscription.txHash, 8, 6) : ""],
            ["Direct team", String(member.directs || 0)],
            ["Active plans", activePlans.length ? activePlans.map((row) => row.planName).join(", ") : "None"],
          ]} />
        </article>
      </div>

      <article className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">Today's task <span className="font-normal text-[#98a2b3]">· {task.day || "—"}</span></p>
          <StatusBadge tone={{ claimed: "success", done: "active", locked: "danger" }[task.state] || "pending"}>{task.status || "Not started"}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-[#667085]">{task.title || "No task"}{task.subtitle ? ` · ${task.subtitle}` : ""}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2f4f7]">
          <div className="h-full rounded-full bg-[#e10600]" style={{ width: `${Math.min(100, Number(task.progress) || 0)}%` }} />
        </div>
        <p className="mt-2 text-xs text-[#667085]">{task.progress || 0}% · watched {task.watchSeconds || 0}s of {task.durationSeconds || 0}s · day {task.day || "—"}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <StatusBadge tone={task.completed ? "success" : "pending"}>{task.completed ? "Watched" : "Not watched"}</StatusBadge>
          <StatusBadge tone={task.roiUnlocked ? "success" : "pending"}>{task.roiUnlocked ? "ROI unlocked" : "ROI locked"}</StatusBadge>
          <StatusBadge tone={task.roiClaimed ? "success" : "pending"}>{task.roiClaimed ? "ROI claimed" : "Not claimed"}</StatusBadge>
          {!task.hasPlan ? <StatusBadge tone="danger">No active plan</StatusBadge> : null}
        </div>
        {task.lastDay ? <p className="mt-2 text-xs text-[#667085]">Not opened today. Last task {task.lastDay}: {task.lastStatus}.</p> : null}
        {member.roiDays?.length ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-[#667085]">Last days</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {member.roiDays.map((row) => (
                <StatusBadge key={row.day} tone={row.status === "Claimed" ? "success" : row.status === "Missed" ? "danger" : row.status === "Off" ? "active" : "pending"}>{row.day.slice(5)} · {row.status}</StatusBadge>
              ))}
            </div>
          </div>
        ) : null}
      </article>

      <article className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">Level income eligibility</p>
          <StatusBadge tone={member.levelIncome?.eligible ? "success" : "danger"}>{member.levelIncome?.eligible ? "Eligible" : "Not eligible"}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-[#667085]">Earns Level 1–15 commission on the team's claimed ROI only with an active ID and at least one active direct.</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <StatusBadge tone={member.levelIncome?.idActive ? "success" : "danger"}>{member.levelIncome?.idActive ? "ID active" : "ID not active"}</StatusBadge>
          <StatusBadge tone={member.levelIncome?.activeDirects ? "success" : "danger"}>{member.levelIncome?.activeDirects || 0} active direct</StatusBadge>
          <StatusBadge tone="active">${fineMoney(member.levelIncome?.total)} earned · {member.levelIncome?.count || 0} credits</StatusBadge>
        </div>
      </article>

      <div className="grid gap-3 lg:grid-cols-2">
        <RecordList resetKey={member.id}
          title="Plans"
          empty="No investments yet."
          rows={member.investments || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">{row.planName}</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#667085]">${money(row.amount)} · {row.dailyRate}% daily · earned ${money(row.earnedRoi)} / ${money(row.cap)}</p>
              <p className="text-xs text-[#98a2b3]">Started {row.startDate}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Direct team"
          empty="No direct members."
          rows={member.team || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">{row.name}</span><StatusBadge tone={row.active ? "active" : "inactive"}>{row.active ? "Active" : "Blocked"}</StatusBadge></div>
              <p className="text-xs text-[#667085]">{row.id} · joined {row.joined || "—"}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Subscription payments"
          empty="No subscription payments."
          rows={member.payments || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">${money(row.amount)} {row.network}</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#667085]">{shortHash(row.txHash, 8, 6)}</p>
              <p className="text-xs text-[#98a2b3]">Submitted {row.submittedAt || "—"}{row.verifiedAt ? ` · verified ${activationLabel(row.verifiedAt)}` : ""}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title={`Level income · $${fineMoney(member.levelIncome?.total)}`}
          empty="No level income yet."
          rows={member.levelCredits || []}
          render={(row, index) => (
            <article key={row.id || index} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">+${fineMoney(row.commission)} · Level {row.level}</span><span className="text-xs text-[#667085]">{row.rate}%</span></div>
              <p className="text-xs text-[#667085]">{row.name ? `${row.name} · ${row.user}` : row.user} · ROI ${money(row.roi)}</p>
              <p className="text-xs text-[#98a2b3]">{showWhen(row.at, row.date)}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Referral credits"
          empty="No referral credits."
          rows={member.referralCredits || []}
          render={(row, index) => (
            <article key={row.id || index} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <p className="font-semibold">${money(row.commission || row.amount)} · Level {row.level || "—"}</p>
              <p className="text-xs text-[#667085]">{row.name ? `${row.name} · ${row.user}` : (row.user || row.description || "Credit")}</p>
              <p className="text-xs text-[#98a2b3]">{row.date || row.at || ""}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Deposits"
          empty="No deposits."
          rows={member.deposits || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">${money(row.amount)} {row.network}</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#98a2b3]">{row.date} · {shortHash(row.tx, 8, 6)}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Withdrawals"
          empty="No withdrawals."
          rows={member.withdrawals || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">${money(row.amount)} · receive ${money(row.receive)}</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#98a2b3]">{row.date} · {row.address ? shortHash(row.address) : row.tx}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Transactions"
          empty="No transactions."
          rows={member.transactions || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{row.type}</span>
                <span>{row.direction === "debit" || Number(row.amount) < 0 ? "−" : "+"}${money(Math.abs(row.amount))}</span>
              </div>
              <p className="text-xs text-[#667085]">{row.description || row.status}</p>
              <p className="text-xs text-[#98a2b3]">{row.date}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Income"
          empty="No income rows."
          rows={member.income || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">{row.type}</span><span>${money(row.amount)}</span></div>
              <p className="text-xs text-[#667085]">{row.description}</p>
              <p className="text-xs text-[#98a2b3]">{row.date}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Watch videos"
          empty="No completed videos."
          rows={member.videoWatches || []}
          render={(row, index) => (
            <article key={`${row.videoId}-${index}`} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <p className="font-semibold">{row.title || "Video"}</p>
              <p className="text-xs text-[#667085]">Reward ${money(row.amount)} · {row.day}</p>
              <p className="text-xs text-[#98a2b3]">{row.at}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Login history"
          empty="No logins recorded."
          rows={member.sessions || []}
          render={(row, index) => (
            <article key={`${row.at}-${index}`} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">{row.device}</span>{row.current ? <StatusBadge tone="active">Current</StatusBadge> : null}</div>
              <p className="text-xs text-[#667085]">{row.ip} · {row.location}</p>
              <p className="text-xs text-[#98a2b3]">{row.at}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Support tickets"
          empty="No tickets."
          rows={member.tickets || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">{row.subject}</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#98a2b3]">{row.updated}</p>
            </article>
          )}
        />
        <RecordList resetKey={member.id}
          title="Fraud flags"
          empty="No fraud flags."
          rows={member.flags || []}
          render={(row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold">{row.type}</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#667085]">{row.note}</p>
              <p className="text-xs text-[#98a2b3]">{row.hits} hit{row.hits === 1 ? "" : "s"}{row.deviceId ? ` · device ${row.deviceId}` : ""}</p>
            </article>
          )}
        />
      </div>

      <RecordList resetKey={member.id}
        title="Notifications"
        empty="No notifications."
        rows={member.notifications || []}
        render={(row, index) => (
          <article key={`${row.title}-${index}`} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
            <p className="font-semibold">{row.title}{row.unread ? " · unread" : ""}</p>
            <p className="text-xs text-[#667085]">{row.body}</p>
          </article>
        )}
      />

    </div>
  );
}

function showWhen(value, fallback = "") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback || String(value);
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
}

const levelTabs = [["credits", "Credits"], ["claims", "ROI claims"], ["skipped", "Skipped"]];

function LevelIncome({ data }) {
  const [tab, setTab] = useState("credits");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("0");
  const totals = data.totals || {};
  const q = query.trim().toLowerCase();
  const match = (...values) => !q || values.join(" ").toLowerCase().includes(q);
  const credits = (data.credits || []).filter((row) => (level === "0" || String(row.level) === level) && match(row.receiver, row.receiverCode, row.from, row.fromName, row.claimId));
  const claims = (data.claims || []).filter((row) => match(row.earner, row.earnerName, row.note));
  const skipped = (data.skipped || []).filter((row) => (level === "0" || String(row.level) === level) && match(row.referralId, row.name, row.earner, row.reason));
  const rows = tab === "credits" ? credits : tab === "claims" ? claims : skipped;
  const list = usePaging(rows, 10, `${tab}:${q}:${level}`);
  const busiest = Math.max(...(data.byLevel || []).map((row) => row.amount), 0);

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<AppIcon name="HandCoins" size={18} />} label="Total paid" value={`$${fineMoney(totals.paid)}`} hint={`${totals.count || 0} credits`} />
        <StatCard icon={<AppIcon name="Coins" size={18} />} label="Paid today" value={`$${fineMoney(totals.todayPaid)}`} hint={`${totals.todayCount || 0} credits today`} />
        <StatCard icon={<AppIcon name="Users" size={18} />} label="Uplines paid" value={String(totals.receivers || 0)} hint="Members with level income" />
        <StatCard icon={<AppIcon name="ListChecks" size={18} />} label="ROI claims" value={String(totals.claims || 0)} hint={`${(data.skipped || []).length} skipped levels`} />
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <article className={card}>
          <p className="font-bold">By level</p>
          <p className="text-xs text-[#667085]">Rate on the claimed ROI. An active ID and one active direct are required.</p>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs text-[#667085]">
              <tr><th className="pb-2 font-medium">Level</th><th className="pb-2 font-medium">Rate</th><th className="pb-2 text-right font-medium">Credits</th><th className="pb-2 text-right font-medium">Paid</th></tr>
            </thead>
            <tbody>
              {(data.byLevel || []).map((row) => (
                <tr key={row.level} className="border-t border-[#f2f4f7]">
                  <td className="py-2 font-semibold">L{row.level}</td>
                  <td className="py-2 text-[#667085]">{row.rate}%</td>
                  <td className="py-2 text-right">{row.count}</td>
                  <td className="py-2 text-right">
                    <span className="font-semibold">${fineMoney(row.amount)}</span>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#f2f4f7]">
                      <span className="block h-full rounded-full bg-[#e10600]" style={{ width: `${busiest ? (row.amount / busiest) * 100 : 0}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className={card}>
          <div className="flex flex-wrap gap-2">
            {levelTabs.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === id ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>
                {label} · {id === "credits" ? credits.length : id === "claims" ? claims.length : skipped.length}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search member ID, name or claim" className="h-10 rounded-xl border border-[#eaecf0] px-3 text-sm" aria-label="Search level income" />
            <select value={level} onChange={(event) => setLevel(event.target.value)} disabled={tab === "claims"} className="h-10 rounded-xl border border-[#eaecf0] px-3 text-sm disabled:opacity-50" aria-label="Level">
              <option value="0">All levels</option>
              {(data.byLevel || []).map((row) => <option key={row.level} value={String(row.level)}>Level {row.level}</option>)}
            </select>
          </div>

          {rows.length === 0 ? (
            <p className="mt-4 rounded-xl bg-[#f8fafc] px-3 py-6 text-center text-sm text-[#98a2b3]">
              {tab === "credits" ? "No level income yet. It appears after a member claims daily ROI." : tab === "claims" ? "No ROI claims with an upline yet." : "No upline has been skipped."}
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {tab === "credits" ? list.items.map((row) => (
                <div key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <NavLink to={`/admin/users/${row.receiverId}`} className="font-semibold hover:text-[#e10600]">{row.receiver || row.receiverCode} <span className="font-normal text-[#98a2b3]">{row.receiverCode}</span></NavLink>
                    <span className="font-bold text-emerald-600">+${fineMoney(row.commission)}</span>
                  </div>
                  <p className="text-xs text-[#667085]">Level {row.level} · {row.rate}% of {row.fromName || row.from} ({row.from}) ROI ${money(row.roi)}</p>
                  <p className="text-xs text-[#98a2b3]">{showWhen(row.at, row.date)} · {row.claimId}</p>
                </div>
              )) : null}
              {tab === "claims" ? list.items.map((row) => (
                <div key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{row.earnerName || row.earner} <span className="font-normal text-[#98a2b3]">{row.earner}</span></span>
                    <span className="text-xs text-[#667085]">ROI ${money(row.roi)} → paid <b className="text-[#101828]">${fineMoney(row.paid)}</b></span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <StatusBadge tone="success">{row.credited} paid</StatusBadge>
                    {row.skipped ? <StatusBadge tone="pending">{row.skipped} skipped</StatusBadge> : null}
                  </div>
                  <p className="mt-1 break-words text-xs text-[#667085]">{row.note}</p>
                  <p className="text-xs text-[#98a2b3]">{showWhen(row.at)}</p>
                </div>
              )) : null}
              {tab === "skipped" ? list.items.map((row, index) => (
                <div key={`${row.at}-${row.level}-${index}`} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{row.name || row.referralId} <span className="font-normal text-[#98a2b3]">{row.referralId}</span></span>
                    <StatusBadge tone="pending">{row.reason}</StatusBadge>
                  </div>
                  <p className="text-xs text-[#667085]">Level {row.level} · would have been {row.rate}% of {row.earner} ROI ${money(row.roi)}</p>
                  <p className="text-xs text-[#98a2b3]">{showWhen(row.at)}</p>
                </div>
              )) : null}
              <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

function payoutGroup(status) {
  if (status === "Pending" || status === "Processing") return "pending";
  if (status === "Rejected" || status === "Failed") return "rejected";
  return "paid";
}

function Withdrawals({ rows, txHash, setTxHash, onApprove, onReject }) {
  const [filter, setFilter] = useState("pending");
  const filtered = filter === "all" ? rows : rows.filter((row) => payoutGroup(row.status) === filter);
  const list = usePaging(filtered, 8, `${filter}:${filtered.length}`);
  const pending = rows.filter((row) => payoutGroup(row.status) === "pending");
  const paid = rows.filter((row) => payoutGroup(row.status) === "paid");
  const rejected = rows.filter((row) => payoutGroup(row.status) === "rejected");
  const toPay = pending.reduce((sum, row) => sum + Number(row.receive || 0), 0);
  const filters = [
    ["pending", "Waiting", pending.length],
    ["paid", "Paid", paid.length],
    ["rejected", "Rejected", rejected.length],
    ["all", "All", rows.length],
  ];
  return (
    <div className="space-y-3">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-[#101828] sm:text-2xl">Withdrawals</h1>
        <p className="mt-0.5 text-sm text-[#667085]">Paste the payout hash, then approve a waiting request or reject it.</p>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["ListChecks", "Waiting", String(pending.length), "Need a decision"],
          ["ArrowUpFromLine", "To pay", `$${money(toPay)}`, "After the 10% fee"],
          ["BadgeCheck", "Paid", String(paid.length), "Already sent"],
          ["LockKeyhole", "Rejected", String(rejected.length), "Funds unlocked"],
        ].map(([icon, label, value, hint]) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-[#e10600]"><AppIcon name={icon} size={18} /></span>
            <span className="min-w-0">
              <span className="block text-[11px] text-[#667085]">{label}</span>
              <span className="block truncate text-base font-black">{value}</span>
              <span className="block text-[11px] text-[#98a2b3]">{hint}</span>
            </span>
          </article>
        ))}
      </section>
      <article className={card}>
        <label className="block text-xs text-[#667085]">Payout transaction hash</label>
        <input value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder="0x… used on the next approval" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
        <div className="mt-3 flex gap-2 overflow-auto no-scrollbar">
          {filters.map(([id, label, count]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === id ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>{label} · {count}</button>
          ))}
        </div>
        {filtered.length === 0 ? <p className="py-8 text-center text-sm text-[#98a2b3]">{filter === "pending" ? "No payouts are waiting." : "No withdrawals in this filter."}</p> : null}
        <div className="mt-3 space-y-2">
          {list.items.map((row) => {
            const waiting = payoutGroup(row.status) === "pending";
            return (
              <article key={row.id} className="flex flex-col gap-3 rounded-2xl border border-[#f2f4f7] bg-[#f8fafc] p-3 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  {row.userId ? (
                    <NavLink to={`/admin/users/${row.userId}`} className="block truncate font-bold text-[#101828]">{row.name}</NavLink>
                  ) : <p className="truncate font-bold">{row.name}</p>}
                  <p className="truncate text-xs text-[#667085]">{row.referralId} · {formatLedgerDate(row.date)}</p>
                  <p className="truncate text-[11px] text-[#98a2b3]">{row.address ? shortHash(row.address, 8, 6) : shortHash(row.tx, 8, 6) || "No address yet"}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center lg:w-64">
                  <span><span className="block text-[10px] text-[#98a2b3]">Requested</span><span className="text-sm font-black">${money(row.amount)}</span></span>
                  <span><span className="block text-[10px] text-[#98a2b3]">Fee</span><span className="text-sm font-bold">${money(row.fee)}</span></span>
                  <span><span className="block text-[10px] text-[#98a2b3]">Receive</span><span className="text-sm font-black text-emerald-600">${money(row.receive)}</span></span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={waiting ? "pending" : payoutGroup(row.status) === "rejected" ? "danger" : "success"}>{row.status}</StatusBadge>
                  {waiting ? (
                    <>
                      <Button type="button" size="sm" onClick={() => onApprove(row.id)}>Approve</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => onReject(row.id)}>Reject</Button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
      </article>
    </div>
  );
}

function Deposits({ rows, onVerify }) {
  const [filter, setFilter] = useState("pending");
  const filtered = filter === "all" ? rows : rows.filter((row) => (filter === "pending" ? row.status === "Pending" : filter === "failed" ? row.status === "Failed" : row.status === "Success"));
  const list = usePaging(filtered, 8, `${filter}:${filtered.length}`);
  const pending = rows.filter((row) => row.status === "Pending");
  const success = rows.filter((row) => row.status === "Success");
  const failed = rows.filter((row) => row.status === "Failed");
  const waitingAmount = pending.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const filters = [
    ["pending", "Waiting", pending.length],
    ["success", "Credited", success.length],
    ["failed", "Failed", failed.length],
    ["all", "All", rows.length],
  ];
  return (
    <div className="space-y-3">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-[#101828] sm:text-2xl">Deposits</h1>
        <p className="mt-0.5 text-sm text-[#667085]">Mark a waiting deposit success to credit the wallet, or failed to leave it unchanged.</p>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["ListChecks", "Waiting", String(pending.length), "Need a review"],
          ["ArrowDownToLine", "To credit", `$${money(waitingAmount)}`, "If marked success"],
          ["BadgeCheck", "Credited", String(success.length), "Already in wallets"],
          ["LockKeyhole", "Failed", String(failed.length), "Not credited"],
        ].map(([icon, label, value, hint]) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-[#e10600]"><AppIcon name={icon} size={18} /></span>
            <span className="min-w-0">
              <span className="block text-[11px] text-[#667085]">{label}</span>
              <span className="block truncate text-base font-black">{value}</span>
              <span className="block text-[11px] text-[#98a2b3]">{hint}</span>
            </span>
          </article>
        ))}
      </section>
      <article className={card}>
        <div className="flex gap-2 overflow-auto no-scrollbar">
          {filters.map(([id, label, count]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === id ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>{label} · {count}</button>
          ))}
        </div>
        {filtered.length === 0 ? <p className="py-8 text-center text-sm text-[#98a2b3]">{filter === "pending" ? "No deposits are waiting." : "No deposits in this filter."}</p> : null}
        <div className="mt-3 space-y-2">
          {list.items.map((row) => (
            <article key={`${row.referralId}-${row.id}`} className="flex flex-col gap-3 rounded-2xl border border-[#f2f4f7] bg-[#f8fafc] p-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                {row.userId ? (
                  <NavLink to={`/admin/users/${row.userId}`} className="block truncate font-bold text-[#101828]">{row.name}</NavLink>
                ) : <p className="truncate font-bold">{row.name}</p>}
                <p className="truncate text-xs text-[#667085]">{row.referralId} · {formatLedgerDate(row.date)}</p>
                <p className="truncate text-[11px] text-[#98a2b3]">{row.network || "BEP-20"} · {shortHash(row.tx, 8, 6) || "No hash yet"}</p>
              </div>
              <div className="text-left lg:w-28 lg:text-right">
                <p className="text-[10px] text-[#98a2b3]">Amount</p>
                <p className="text-lg font-black">${money(row.amount)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={row.status === "Pending" ? "pending" : row.status === "Failed" ? "danger" : "success"}>{row.status}</StatusBadge>
                {row.status === "Pending" ? (
                  <>
                    <Button type="button" size="sm" onClick={() => onVerify(row.id, "success")}>Mark Success</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => onVerify(row.id, "failed")}>Mark Failed</Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
      </article>
    </div>
  );
}

function planOffer(plan) {
  const min = Number(plan.min) || 0;
  const dailyRate = Number(plan.dailyRate) || 0;
  const maxRoi = Number(plan.maxRoi) || 0;
  const daily = (min * dailyRate) / 100;
  const cap = (min * maxRoi) / 100;
  return { min, dailyRate, maxRoi, daily, cap, days: Number(plan.validity) || 0 };
}

function PlansPanel({ plans, setPlans, draft, setDraft, onCreate, onSave }) {
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const published = plans.filter((plan) => plan.active).length;
  const hidden = plans.length - published;
  const filtered = filter === "all" ? plans : plans.filter((plan) => (filter === "published" ? plan.active : !plan.active));
  const update = (id, key, value) => {
    setPlans(plans.map((plan) => (plan.id === id ? { ...plan, [key]: value } : plan)));
  };
  const markPopular = (plan) => {
    const previous = plans.find((row) => row.popular && row.id !== plan.id);
    if (previous) onSave({ ...previous, popular: false });
    onSave({ ...plan, popular: true });
  };
  return (
    <div className="space-y-3">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#101828] sm:text-2xl">Plans</h1>
          <p className="mt-0.5 text-sm text-[#667085]">Set the minimum, daily rate and cap. Hidden plans stay off the member invest page.</p>
        </div>
        <Button type="button" variant={adding ? "outline" : "default"} onClick={() => setAdding((open) => !open)}>{adding ? "Close" : "Add plan"}</Button>
      </section>
      <section className="grid grid-cols-3 gap-3">
        {[
          ["Landmark", "Plans", String(plans.length), "In the catalog"],
          ["BadgeCheck", "Published", String(published), "Members can buy"],
          ["LockKeyhole", "Hidden", String(hidden), "Off the invest page"],
        ].map(([icon, label, value, hint]) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-[#e10600]"><AppIcon name={icon} size={18} /></span>
            <span className="min-w-0">
              <span className="block text-[11px] text-[#667085]">{label}</span>
              <span className="block truncate text-base font-black">{value}</span>
              <span className="hidden text-[11px] text-[#98a2b3] sm:block">{hint}</span>
            </span>
          </article>
        ))}
      </section>
      {adding ? (
        <form onSubmit={onCreate} className={card}>
          <p className="font-bold">New plan</p>
          <p className="mt-1 text-xs text-[#98a2b3]">Id stays in the URL and cannot be changed later. Example: gold</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              ["planId", "Plan id"],
              ["name", "Name"],
              ["min", "Minimum USDT"],
              ["dailyRate", "Daily rate %"],
              ["maxRoi", "Cap %"],
              ["validity", "Validity days"],
            ].map(([key, label]) => (
              <label key={key} className="text-xs text-[#667085]">
                {label}
                <input
                  value={draft[key] ?? ""}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm text-[#101828]"
                  required
                />
              </label>
            ))}
          </div>
          <OffDaysPicker value={draft.offDays} onChange={(days) => setDraft({ ...draft, offDays: days })} />
          <p className="mt-3 text-sm text-[#475467]">{offerLine(draft)}</p>
          <Button className="mt-4" type="submit">Publish plan</Button>
        </form>
      ) : null}
      <div className="flex gap-2 overflow-auto no-scrollbar">
        {[["all", "All", plans.length], ["published", "Published", published], ["hidden", "Hidden", hidden]].map(([id, label, count]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === id ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>{label} · {count}</button>
        ))}
      </div>
      {filtered.length === 0 ? <p className="rounded-2xl border border-[#eaecf0] bg-white py-8 text-center text-sm text-[#98a2b3]">No plans in this filter.</p> : null}
      {filtered.map((plan) => {
        const offer = planOffer(plan);
        return (
          <article key={plan.id} className={card}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <label className="text-xs text-[#667085]">
                  Plan name
                  <input value={plan.name || ""} onChange={(event) => update(plan.id, "name", event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm font-bold text-[#101828]" />
                </label>
                <p className="mt-1 text-[11px] text-[#98a2b3]">Id {plan.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={plan.active ? "success" : "warning"}>{plan.active ? "Published" : "Hidden"}</StatusBadge>
                {plan.popular ? <StatusBadge tone="danger">Popular</StatusBadge> : null}
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-[#f8fafc] px-3 py-2 text-sm text-[#475467]">{offerLine(plan)}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              {[
                ["min", "Minimum USDT"],
                ["dailyRate", "Daily rate %"],
                ["maxRoi", "Cap %"],
                ["validity", "Validity days"],
              ].map(([key, label]) => (
                <label key={key} className="text-xs text-[#667085]">
                  {label}
                  <input
                    value={plan[key] ?? ""}
                    onChange={(event) => update(plan.id, key, event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm text-[#101828]"
                  />
                </label>
              ))}
            </div>
            <OffDaysPicker value={plan.offDays} onChange={(days) => update(plan.id, "offDays", days)} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => onSave(plan)}>Save changes</Button>
              <Button type="button" variant="outline" onClick={() => onSave({ ...plan, active: !plan.active })}>{plan.active ? "Hide from members" : "Publish"}</Button>
              <Button type="button" variant="outline" disabled={plan.popular} onClick={() => markPopular(plan)}>{plan.popular ? "Marked popular" : "Mark popular"}</Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const weekOrder = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];

function offLabel(offDays) {
  const off = weekOrder.filter(([day]) => (offDays || []).includes(day)).map(([, label]) => label);
  return off.length ? `No ROI on ${off.join(", ")}` : "ROI every day";
}

function OffDaysPicker({ value, onChange }) {
  const off = Array.isArray(value) ? value : [];
  const toggle = (day) => {
    const next = off.includes(day) ? off.filter((item) => item !== day) : [...off, day];
    if (next.length < 7) onChange(next.sort());
  };
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#667085]">ROI off days <span className="text-[#98a2b3]">· no task and no ROI on these days</span></p>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onChange([])} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-[#475467]">Every day</button>
          <button type="button" onClick={() => onChange([0, 6])} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-[#475467]">Sat & Sun off</button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {weekOrder.map(([day, label]) => {
          const isOff = off.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isOff}
              onClick={() => toggle(day)}
              className={`h-10 rounded-xl border text-xs font-bold transition ${isOff ? "border-[#e10600] bg-red-50 text-[#e10600]" : "border-[#eaecf0] bg-white text-[#101828]"}`}
            >
              {label}
              <span className="block text-[9px] font-semibold opacity-70">{isOff ? "Off" : "ROI"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function offerLine(plan) {
  const offer = planOffer(plan);
  if (!offer.min || !offer.dailyRate) return "Enter a minimum and daily rate to preview what a member earns.";
  const offCount = (plan.offDays || []).length;
  const paying = offer.daily > 0 ? Math.ceil(offer.cap / offer.daily) : 0;
  const weeks = offCount && paying ? ` About ${Math.ceil((paying / (7 - offCount)) * 7)} calendar days to reach the cap.` : "";
  return `A $${money(offer.min)} buy pays $${money(offer.daily)} a day until $${money(offer.cap)} (${offer.maxRoi}% cap, ${offer.days} days). ${offLabel(plan.offDays)}.${weeks}`;
}

function Subscriptions({ rows, onReview }) {
  const [filter, setFilter] = useState("pending");
  const pending = rows.filter((row) => row.status === "Pending");
  const success = rows.filter((row) => row.status === "Success");
  const failed = rows.filter((row) => row.status === "Failed");
  const filtered = filter === "all" ? rows : filter === "pending" ? pending : filter === "failed" ? failed : success;
  const list = usePaging(filtered, 8, `${filter}:${filtered.length}`);
  const waitingAmount = pending.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const filters = [
    ["pending", "Waiting", pending.length],
    ["success", "Activated", success.length],
    ["failed", "Failed", failed.length],
    ["all", "All", rows.length],
  ];
  return (
    <div className="space-y-3">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-[#101828] sm:text-2xl">Subscriptions</h1>
        <p className="mt-0.5 text-sm text-[#667085]">Approve a waiting payment to activate the member ID. A failed payment leaves the ID inactive.</p>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["ListChecks", "Waiting", String(pending.length), "Need a review"],
          ["BadgeCheck", "To activate", `$${money(waitingAmount)}`, "If marked success"],
          ["Users", "Activated", String(success.length), "IDs already live"],
          ["LockKeyhole", "Failed", String(failed.length), "Not approved"],
        ].map(([icon, label, value, hint]) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-[#e10600]"><AppIcon name={icon} size={18} /></span>
            <span className="min-w-0">
              <span className="block text-[11px] text-[#667085]">{label}</span>
              <span className="block truncate text-base font-black">{value}</span>
              <span className="block text-[11px] text-[#98a2b3]">{hint}</span>
            </span>
          </article>
        ))}
      </section>
      <article className={card}>
        <div className="flex gap-2 overflow-auto no-scrollbar">
          {filters.map(([id, label, count]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === id ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>{label} · {count}</button>
          ))}
        </div>
        {filtered.length === 0 ? <p className="py-8 text-center text-sm text-[#98a2b3]">{filter === "pending" ? "No subscription payments are waiting." : "No payments in this filter."}</p> : null}
        <div className="mt-3 space-y-2">
          {list.items.map((row) => (
            <article key={row.id} className="flex flex-col gap-3 rounded-2xl border border-[#f2f4f7] bg-[#f8fafc] p-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                {row.userId ? (
                  <NavLink to={`/admin/users/${row.userId}`} className="block truncate font-bold text-[#101828]">{row.name}</NavLink>
                ) : <p className="truncate font-bold">{row.name}</p>}
                <p className="truncate text-xs text-[#667085]">{row.referralId} · {formatLedgerDate(row.submittedAt)}</p>
                <p className="truncate text-[11px] text-[#98a2b3]">{row.network || "BEP-20"} · {shortHash(row.txHash, 8, 6) || "No hash yet"}</p>
              </div>
              <div className="text-left lg:w-28 lg:text-right">
                <p className="text-[10px] text-[#98a2b3]">Amount</p>
                <p className="text-lg font-black">${money(row.amount)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={row.status === "Pending" ? "pending" : row.status === "Failed" ? "danger" : "success"}>{row.status === "Success" ? "Activated" : row.status === "Pending" ? "Waiting" : row.status}</StatusBadge>
                {row.status === "Pending" ? (
                  <>
                    <Button type="button" size="sm" onClick={() => onReview(row.id, "success")}>Mark Success</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => onReview(row.id, "failed")}>Mark Failed</Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
      </article>
    </div>
  );
}

function SettingsForm({ settings, setSettings, onSave }) {
  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setSettings({ ...settings, [key]: value });
  };
  const fields = [
    ["subscriptionAmount", "Subscription USDT"],
    ["signupBonus", "Signup bonus USDT"],
    ["level1", "Level 1 commission"],
    ["level2", "Level 2 commission"],
    ["level3", "Level 3 commission"],
    ["level4", "Level 4 commission"],
    ["minWithdraw", "Minimum withdrawal"],
    ["withdrawFeeRate", "Withdrawal fee rate"],
    ["taskDuration", "Task seconds"],
    ["taskRequired", "Required watch %"],
    ["taskTitle", "Task title"],
    ["taskVideoUrl", "Task video URL"],
    ["bep20Rpc", "BEP-20 RPC URL"],
    ["depositAddress", "Platform deposit address"],
  ];
  return (
    <form onSubmit={onSave} className={card}>
      <p className="font-bold">Platform settings</p>
      <p className="text-xs text-[#98a2b3]">Signup bonus is credited once when a member creates an account. Set it to 0 to turn the bonus off. Commission, withdrawal limits and the published daily task use these values too.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="text-xs text-[#667085]">
            {label}
            <input value={settings[key] ?? ""} onChange={set(key)} className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm text-[#101828]" />
          </label>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={Boolean(settings.taskPublished)} onChange={set("taskPublished")} />
        Daily task is published
      </label>
      <Button className="mt-4" type="submit">Save settings</Button>
    </form>
  );
}
