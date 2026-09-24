import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import AppIcon from "@/components/common/AppIcon";
import { user } from "@/data/mockData";
import { TODAY_ROI, useApp } from "@/context/AppContext";
import { money } from "@/lib/utils";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";

const week = [
  { day: "18 Sep", roi: 18, referral: 14 },
  { day: "19 Sep", roi: 24, referral: 16 },
  { day: "20 Sep", roi: 28, referral: 15 },
  { day: "21 Sep", roi: 32, referral: 19 },
  { day: "22 Sep", roi: 30, referral: 21 },
  { day: "23 Sep", roi: 36, referral: 18 },
  { day: "24 Sep", roi: 33, referral: 20 },
];

const txRows = [
  { id: 1, date: "24 Sep 2026, 10:30 AM", type: "ROI Credit", amount: 2.5, status: "Success", icon: "HandCoins", tone: "bg-emerald-50 text-emerald-500" },
  { id: 2, date: "23 Sep 2026, 04:15 PM", type: "Referral Income", amount: 2, status: "Success", icon: "Gift", tone: "bg-sky-50 text-sky-500" },
  { id: 3, date: "22 Sep 2026, 11:20 AM", type: "Withdrawal", amount: -20, status: "Pending", icon: "ArrowUpFromLine", tone: "bg-rose-50 text-rose-500" },
  { id: 4, date: "21 Sep 2026, 03:40 PM", type: "Deposit", amount: 50, status: "Success", icon: "ArrowDownToLine", tone: "bg-emerald-50 text-emerald-500" },
  { id: 5, date: "21 Sep 2026, 01:15 PM", type: "Bonus", amount: 1.5, status: "Success", icon: "Coins", tone: "bg-amber-50 text-amber-500" },
];

const notes = [
  { icon: "Gift", tone: "bg-orange-50 text-orange-500", title: "Daily Bonus Available", body: "Watch 10 videos and get extra $0.50 USDT", time: "2 hours ago" },
  { icon: "UserPlus", tone: "bg-emerald-50 text-emerald-500", title: "New Referral Joined", body: "Amit Sharma joined using your link", time: "5 hours ago" },
  { icon: "Wallet", tone: "bg-sky-50 text-sky-500", title: "Withdrawal Request", body: "Your withdrawal request is under review", time: "1 day ago" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { balances, taskProgress, taskCompleted, roiUnlocked, roiClaimed, subscriptionActive, claimRoi } = useApp();
  const guard = useActiveGuard();
  const [hidden, setHidden] = useState(false);
  const progress = taskCompleted ? 100 : taskProgress;
  const roiStatus = roiClaimed ? "Claimed" : roiUnlocked ? "Available" : "Locked";
  const activeStep = roiClaimed ? 5 : roiUnlocked ? 4 : taskCompleted ? 2 : 1;

  const onClaim = () => {
    if (!guard()) return;
    const result = claimRoi();
    if (result?.reason === "locked") navigate("/daily-task");
  };

  const stats = [
    { icon: "Wallet", iconBg: "bg-emerald-50 text-emerald-500", label: "Today's ROI", value: `$${money(TODAY_ROI)}`, hint: roiClaimed ? "Credited to wallet" : "Complete today's task to unlock", hintClass: "text-[#98a2b3]", badge: roiStatus, to: "/roi" },
    { icon: "Gift", iconBg: "bg-emerald-50 text-emerald-600", label: "Total ROI Earned", value: "$312.50", hint: "+12% this month", hintClass: "text-emerald-500", to: "/income/roi" },
    { icon: "Users", iconBg: "bg-rose-50 text-rose-500", label: "Referral Income", value: "$180.00", hint: "33.2% of total", hintClass: "text-[#98a2b3]", to: "/income/referral" },
    { icon: "Landmark", iconBg: "bg-sky-50 text-sky-500", label: "Active Plan", value: "$100.00", hint: "Standard Plan", hintClass: "text-[#98a2b3]", to: "/investment" },
    { icon: "HandCoins", iconBg: "bg-emerald-50 text-emerald-500", label: "Total Income", value: "$542.50", hint: "+18% this month", hintClass: "text-emerald-500", to: "/income" },
    { icon: "Users", iconBg: "bg-sky-50 text-sky-500", label: "Total Team", value: "126", hint: "94 Active Members", hintClass: "text-[#98a2b3]", to: "/team" },
  ];

  return (
    <div className="mx-auto max-w-[1180px] space-y-3">
      <InactiveBanner className="mb-0" />
      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[#667085] lg:hidden">Good Morning <span aria-hidden="true">👋</span></p>
          <h1 className="truncate text-xl font-black tracking-tight text-[#101828] sm:text-2xl">
            <span className="lg:hidden">{user.name}</span>
            <span className="hidden lg:inline">Welcome Back, {user.name} <span aria-hidden="true">👋</span></span>
          </h1>
          <p className="mt-0.5 text-sm text-[#667085] lg:hidden">ID: {user.id}</p>
          <p className="mt-0.5 hidden text-sm text-[#667085] lg:block">Watch videos, complete tasks and earn instant rewards.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 lg:hidden">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {subscriptionActive ? "Active" : "Not Active"}
        </span>
        <div className="hidden items-center gap-2 lg:flex">
          <article className="flex items-center gap-2 rounded-2xl border border-[#eaecf0] bg-white px-3 py-2 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-500"><AppIcon name="BadgeCheck" size={16} /></span>
            <span>
              <span className="block text-[11px] text-[#667085]">Account Status</span>
              <span className="text-xs font-black text-emerald-600">{subscriptionActive ? "ACTIVE" : "INACTIVE"}</span>
            </span>
          </article>
          <article className="flex items-center gap-2 rounded-2xl border border-[#eaecf0] bg-white px-3 py-2 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-50 text-[#e10600]"><AppIcon name="CreditCard" size={16} /></span>
            <span>
              <span className="block text-[11px] text-[#667085]">Subscription</span>
              <span className="block text-xs font-black">$10 USDT</span>
              <span className="block text-[10px] text-[#98a2b3]">Activated on 24 Sep 2026</span>
            </span>
          </article>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <article className="relative overflow-hidden rounded-2xl bg-[linear-gradient(125deg,#5b21b6_0%,#7c3aed_42%,#db2777_100%)] p-5 text-white shadow-[0_16px_36px_rgba(91,33,182,0.28)] lg:col-span-5">
          <img src="/images/wallet-card.png" alt="" className="pointer-events-none absolute -right-8 -top-3 h-32 w-32 object-cover [mask-image:radial-gradient(circle_at_55%_48%,black_42%,transparent_72%)] sm:-right-6 sm:-top-4 sm:h-44 sm:w-44" />
          <p className="text-sm text-white/80">Total Balance (USDT)</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-4xl font-black tracking-tight">{hidden ? "••••" : `$${money(balances.total)}`}</p>
            <button type="button" aria-label="Toggle balance visibility" onClick={() => setHidden((v) => !v)} className="text-white/80">
              {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1 text-sm text-white/75">≈ {hidden ? "••••" : `${money(balances.total)} USDT`}</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <button onClick={() => navigate("/wallet/deposit")} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#e10600] px-2 text-xs font-bold sm:text-sm"><AppIcon name="ArrowDownToLine" size={15} /> Deposit</button>
            <button onClick={() => { if (!guard()) return; navigate("/wallet/withdraw"); }} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-white px-2 text-xs font-bold text-[#111827] sm:text-sm"><AppIcon name="ArrowUpFromLine" size={15} /> Withdraw</button>
            <button onClick={() => navigate("/wallet/transfer")} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#4c1d95] px-2 text-xs font-bold sm:text-sm"><AppIcon name="ArrowLeftRight" size={15} /> Transfer</button>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-3 lg:col-span-7 lg:grid-cols-3">
          {stats.map((item) => (
            <button key={item.label} onClick={() => navigate(item.to)} className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#eaecf0] bg-white p-3 text-left shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.iconBg}`}><AppIcon name={item.icon} size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] leading-tight text-[#667085]">{item.label}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1">
                  <span className="text-base font-black tracking-tight">{item.value}</span>
                  {item.badge ? <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">{item.badge}</span> : null}
                </span>
                <span className={`block text-[11px] leading-tight ${item.hintClass}`}>{item.hint}</span>
              </span>
              <ChevronRight size={14} className="shrink-0 text-[#d0d5dd]" />
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-bold">Today's Task</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${taskCompleted ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{taskCompleted ? "Completed" : "Pending"}</span>
            </div>
            <button className="text-xs font-semibold text-[#e10600]" onClick={() => navigate("/daily-task")}>View All</button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/daily-task")} className="relative grid h-[92px] w-[148px] shrink-0 place-items-center overflow-hidden rounded-xl" aria-label="Start watching">
              <img src="/images/video-thumb.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#111] shadow">
                <AppIcon name="Play" size={16} className="ml-0.5 fill-[#111]" />
              </span>
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">02:30</span>
            </button>
            <div className="min-w-0">
              <p className="font-bold">Watch Sponsored Video</p>
              <p className="mt-1 text-xs leading-5 text-[#667085]">Watch full video and complete the task to unlock your today's ROI.</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#667085]">
            <span>{progress}% Complete</span>
            <span>{taskCompleted ? "1 / 1" : "0 / 1"}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f2f4f7]">
            <div className="h-full rounded-full bg-[#e10600]" style={{ width: `${progress}%` }} />
          </div>
          <button onClick={() => navigate("/daily-task")} className="mt-3 h-11 w-full rounded-xl bg-[#e10600] text-sm font-bold text-white">
            {taskCompleted ? "Task Completed" : "Start Watching →"}
          </button>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold">Today's ROI Progress</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${roiClaimed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>{roiStatus}</span>
          </div>
          <ol className="grid grid-cols-4 gap-1">
            {["Complete Today's Task", "Task Verification", "Unlock ROI", "Claim ROI"].map((label, index) => {
              const n = index + 1;
              const current = n === activeStep;
              const done = n < activeStep;
              return (
                <li key={label} className="text-center">
                  <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${current ? "bg-[#e10600] text-white" : done ? "bg-emerald-500 text-white" : "bg-[#f2f4f7] text-[#98a2b3]"}`}>{n}</span>
                  <span className="mt-1 block text-[10px] leading-3 text-[#667085]">{label}</span>
                </li>
              );
            })}
          </ol>
          <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl px-3 py-3 ${roiClaimed ? "bg-emerald-50" : "bg-rose-50"}`}>
            <div className="flex items-center gap-2">
              <span className={`grid h-9 w-9 place-items-center rounded-full ${roiClaimed ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"}`}>
                <AppIcon name={roiClaimed ? "BadgeCheck" : "LockKeyhole"} size={16} />
              </span>
              <span>
                <span className="block text-sm font-black">${money(TODAY_ROI)} USDT</span>
                <span className="block text-[11px] text-[#667085]">
                  {roiClaimed ? "Today's ROI has been credited." : roiUnlocked ? "Ready to claim." : "Complete today's task to unlock your ROI"}
                </span>
              </span>
            </div>
            <button
              onClick={() => {
                if (roiClaimed) navigate("/roi");
                else if (roiUnlocked) onClaim();
                else navigate("/daily-task");
              }}
              className="h-9 shrink-0 rounded-lg bg-[#e10600] px-3 text-xs font-bold text-white"
            >
              {roiClaimed ? "View ROI" : roiUnlocked ? "Claim" : "Go to Task"}
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm xl:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold">Earnings Overview</p>
            <span className="rounded-lg border border-[#eaecf0] px-2 py-1 text-[11px] font-semibold text-[#475467]">Last 7 Days</span>
          </div>
          <div className="mb-2 flex gap-3 text-[11px] text-[#667085]">
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#3b82f6]" /> ROI Income</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#ef4444]" /> Referral Income</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={week} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#f2f4f7" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#98a2b3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#98a2b3" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="roi" name="ROI Income" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="referral" name="Referral Income" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Recent Transactions</p>
            <button className="text-xs font-semibold text-[#e10600]" onClick={() => navigate("/wallet/transactions")}>View All</button>
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-xs">
              <thead className="text-[#98a2b3]">
                <tr>{["#", "Date & Time", "Type", "Amount", "Status"].map((h) => <th key={h} className="pb-2 pr-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {txRows.map((row) => (
                  <tr key={row.id} className="border-t border-[#f8fafc]">
                    <td className="py-2 pr-2 text-[#98a2b3]">{row.id}</td>
                    <td className="whitespace-nowrap pr-2">{row.date}</td>
                    <td className="pr-2">{row.type}</td>
                    <td className={`pr-2 font-bold ${row.amount < 0 ? "text-rose-500" : "text-emerald-600"}`}>{row.amount < 0 ? "-" : "+"}${money(Math.abs(row.amount))}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 lg:hidden">
            {txRows.map((row) => (
              <li key={row.id} className="flex items-center gap-2">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${row.tone}`}><AppIcon name={row.icon} size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{row.type}</span>
                  <span className="block truncate text-[11px] text-[#98a2b3]">{row.date}</span>
                </span>
                <span className="text-right">
                  <span className={`block text-sm font-bold ${row.amount < 0 ? "text-rose-500" : "text-emerald-600"}`}>{row.amount < 0 ? "-" : "+"}${money(Math.abs(row.amount))}</span>
                  <span className={`text-[10px] font-bold ${row.status === "Pending" ? "text-amber-600" : "text-emerald-600"}`}>{row.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <p className="mb-3 font-bold">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["ArrowDownToLine", "bg-emerald-50 text-emerald-500", "Deposit", "Add funds to wallet", "/wallet/deposit"],
              ["ArrowUpFromLine", "bg-rose-50 text-rose-500", "Withdraw", "Send to external wallet", "/wallet/withdraw"],
              ["Play", "bg-violet-50 text-violet-500", "Watch Videos", "Earn instant rewards", "/watch"],
              ["Gift", "bg-amber-50 text-amber-500", "Refer & Earn", "Share link & earn", "/referral"],
            ].map(([icon, tone, label, hint, to]) => (
              <button key={label} onClick={() => navigate(to)} className="rounded-2xl border border-[#f2f4f7] bg-[#fafbfc] p-3 text-left">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><AppIcon name={icon} size={16} /></span>
                <span className="mt-2 block text-sm font-bold">{label}</span>
                <span className="block text-[11px] text-[#98a2b3]">{hint}</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Latest Notifications</p>
            <button className="text-xs font-semibold text-[#e10600]" onClick={() => navigate("/notifications")}>View All</button>
          </div>
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.title} className="flex gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${note.tone}`}><AppIcon name={note.icon} size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{note.title}</span>
                    <span className="shrink-0 text-[11px] text-[#98a2b3]">{note.time}</span>
                  </span>
                  <span className="block text-xs text-[#667085]">{note.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-[linear-gradient(105deg,#7f1020_0%,#e10600_46%,#4c0519_100%)] p-5 text-white shadow-[0_16px_32px_rgba(225,6,0,0.22)]">
          <img src="/images/trophy-earn.png" alt="" className="pointer-events-none absolute -bottom-6 -right-4 hidden h-48 w-48 object-cover [mask-image:radial-gradient(circle_at_50%_45%,black_38%,transparent_72%)] sm:block" />
          <div className="relative max-w-sm">
            <p className="text-xl font-black leading-tight">Complete Daily Tasks & Earn ROI</p>
            <p className="mt-1 text-sm text-white/80">Watch videos, complete tasks, refer friends and earn daily rewards.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              {[["Play", "Watch Videos"], ["ListChecks", "Complete Tasks"], ["LockKeyhole", "Unlock ROI"], ["Gift", "Refer & Earn"], ["Wallet", "Withdraw Earnings"]].map(([icon, label]) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-1">
                  <AppIcon name={icon} size={12} /> {label}
                </span>
              ))}
            </div>
            <button onClick={() => navigate("/daily-task")} className="mt-4 h-10 rounded-xl bg-white px-4 text-sm font-bold text-[#e10600]">Start Earning Now →</button>
          </div>
        </article>
      </section>
    </div>
  );
}
