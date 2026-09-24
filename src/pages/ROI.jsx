import { useNavigate } from "react-router-dom";
import { CircleCheck, Clock3, Lock, Play, Wallet } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ProgressBar from "@/components/common/ProgressBar";
import { Button } from "@/components/ui/button";
import { TODAY_ROI, useApp } from "@/context/AppContext";
import AppIcon from "@/components/common/AppIcon";
import { money } from "@/lib/utils";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";
import { roiCalendar } from "@/data/mockData";

const steps = [
  ["Claim ROI", "Click the button to start"],
  ["Watch Video", "Watch the complete video"],
  ["Task Complete", "System will verify"],
  ["Claim & Earn", "ROI will be credited"],
];

export default function ROI() {
  const navigate = useNavigate();
  const { taskProgress, taskCompleted, roiUnlocked, roiClaimed, balances, tasks, claimRoi, watching } = useApp();
  const guard = useActiveGuard();
  const current = roiClaimed ? 4 : taskCompleted ? 3 : taskProgress > 0 ? 2 : 1;
  const claimedDays = roiCalendar.filter((d) => d.status === "Claimed").length;
  const missedDays = roiCalendar.filter((d) => d.status === "Missed" || d.status === "Expired").length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="Daily ROI / Claim"
        subtitle="Complete today's activity to unlock and claim your daily ROI. Missed days do not carry forward."
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Daily ROI" }]}
      />
      <InactiveBanner />

      <section className="mb-4 rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-bold">September 2026 · Missed day calendar</p>
            <p className="text-xs text-[#98a2b3]">Activity completed → ROI eligible. Not completed → missed, no carry-forward.</p>
          </div>
          <p className="text-xs text-[#667085]">{claimedDays} claimed · {missedDays} missed/expired · today pending</p>
        </div>
        <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-[#667085]">
          {[["Claimed", "bg-emerald-500"], ["Missed", "bg-rose-500"], ["Expired", "bg-slate-400"], ["Pending", "bg-amber-400"]].map(([label, cls]) => (
            <span key={label} className="inline-flex items-center gap-1"><i className={`h-2 w-2 rounded-full ${cls}`} /> {label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => <span key={d} className="py-1 font-semibold text-[#98a2b3]">{d}</span>)}
          {Array.from({ length: 2 }, (_, i) => <span key={`pad-${i}`} />)}
          {roiCalendar.map((item) => {
            const tone = item.status === "Claimed" ? "bg-emerald-50 text-emerald-700" : item.status === "Missed" ? "bg-rose-50 text-rose-600" : item.status === "Expired" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
            return (
              <span key={item.day} title={`${item.status} · ${item.claim}`} className={`rounded-lg py-2 font-semibold ${tone}`}>{item.day}</span>
            );
          })}
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Today's ROI", `$${money(TODAY_ROI)}`, "bg-sky-50 text-sky-600", "HandCoins"],
          ["Task Status", taskCompleted ? "Completed" : watching ? "In Progress" : "Pending", "bg-emerald-50 text-emerald-600", "CircleCheck"],
          ["Watch Progress", `${taskCompleted ? 100 : taskProgress}%`, "bg-orange-50 text-orange-600", "Play"],
          ["Wallet Balance", `$${money(balances.total)}`, "bg-amber-50 text-amber-600", "Wallet"],
        ].map(([label, value, color, icon]) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 shadow-sm">
            <span className={`grid h-11 w-11 place-items-center rounded-full ${color}`}><AppIcon name={icon} /></span>
            <div>
              <p className="text-xs text-[#667085]">{label}</p>
              <p className="font-bold">{value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mb-4 rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {steps.map(([title, body], index) => {
            const n = index + 1;
            const done = n < current || (n === 4 && roiClaimed);
            const active = n === current && !roiClaimed;
            return (
              <div key={title} className="text-center">
                <div className="mb-2 flex items-center">
                  <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${done || active ? "bg-[#e10600] text-white" : "bg-slate-100 text-slate-400"}`}>{n}</span>
                </div>
                <p className="text-xs font-semibold sm:text-sm">{title}</p>
                <p className="hidden text-[11px] text-[#98a2b3] sm:block">{body}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#e10600]" style={{ width: `${((current - 1) / 3) * 100}%` }} />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.1fr_1.3fr_0.8fr]">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Today's Task</p>
            <StatusBadge tone="danger">Required</StatusBadge>
          </div>
          <div className="flex gap-3">
            <div className="grid h-16 w-24 place-items-center rounded-xl bg-slate-900 text-white"><Play className="fill-white" size={16} /></div>
            <div>
              <p className="font-semibold">Watch Sponsored Video</p>
              <p className="text-xs text-[#667085]">Brand Promotion</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-xl bg-slate-50 p-2"><p className="text-[#98a2b3]">Duration</p><p className="font-bold">2 Minutes</p></div>
            <div className="rounded-xl bg-slate-50 p-2"><p className="text-[#98a2b3]">Reward</p><p className="font-bold">Unlock ROI</p></div>
            <div className="rounded-xl bg-slate-50 p-2"><p className="text-[#98a2b3]">Required</p><p className="font-bold">95%</p></div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#667085]">Watch this short promotional video completely to unlock today's ROI. Keep the video in focus until it finishes.</p>
          <Button className="mt-4 w-full" onClick={() => navigate("/daily-task")}>{taskCompleted ? "View Task" : "Watch Video"}</Button>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-sm">
          <div className="relative grid h-52 place-items-center bg-gradient-to-br from-[#24143a] via-[#5b2a86] to-[#e11d48] text-white sm:h-64">
            <div className="text-center">
              <p className="text-2xl font-black">NEW HORIZON</p>
              <p className="text-lg font-semibold">SMARTPHONE</p>
              <p className="text-xs text-white/70">Faster. Smarter. Brighter.</p>
            </div>
            <button onClick={() => navigate("/daily-task")} className="absolute grid h-14 w-14 place-items-center rounded-full bg-white/90 text-[#111]" aria-label="Play sponsored video">
              <Play className="fill-[#111]" />
            </button>
            <div className="absolute inset-x-3 bottom-3">
              <ProgressBar value={taskCompleted ? 100 : taskProgress} />
              <p className="mt-1 text-right text-[11px]">{Math.floor(((taskCompleted ? 100 : taskProgress) / 100) * 120)}s / 2:00</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-center shadow-sm">
          <p className="font-bold">Task Progress</p>
          <div className="relative mx-auto my-4 grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(#e10600 ${taskCompleted ? 100 : taskProgress}%, #f2f4f7 0)` }}>
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-xl font-black">{taskCompleted ? 100 : taskProgress}%</div>
          </div>
          <p className="text-sm font-semibold">{roiClaimed ? "Credited" : watching ? "Watching..." : taskCompleted ? "Ready to claim" : "Not started"}</p>
          <p className="mt-1 text-xs text-[#667085]">Watched Time {Math.floor(((taskCompleted ? 100 : taskProgress) / 100) * 2)}:{String(Math.floor((((taskCompleted ? 100 : taskProgress) / 100) * 120) % 60)).padStart(2, "0")} / 02:00</p>
          <p className="mt-3 text-xs text-[#667085]">Keep watching until the video completes to unlock your ROI.</p>
        </article>
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl bg-gradient-to-br from-[#3a0d14] to-[#e10600] p-4 text-center text-white">
          <p className="text-sm font-semibold">Today's ROI Status</p>
          <p className="mt-2 text-4xl font-black">${money(TODAY_ROI)}</p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-xs font-bold">
            <Lock size={12} /> {roiClaimed ? "CLAIMED" : roiUnlocked ? "UNLOCKED" : "LOCKED"}
          </p>
          <p className="mt-3 text-xs text-white/80">{roiClaimed ? "Today's ROI has been credited to your wallet." : roiUnlocked ? "Your ROI is ready to claim." : "Complete today's activity to unlock your ROI."}</p>
          <button onClick={() => { if (!guard()) return; claimRoi(); }} disabled={roiClaimed} className="mt-4 h-11 w-full rounded-xl bg-white font-bold text-[#e10600] disabled:opacity-70">
            {roiClaimed ? "CLAIMED" : "CLAIM TODAY'S ROI"}
          </button>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <p className="font-bold">Important Instructions</p>
          <ul className="mt-2 space-y-2 text-sm text-[#475467]">
            {["Watch the full 2 minute video", "Keep the video in focus (do not minimize)", "Do not use multiple accounts", "After completion, click Claim ROI", "You will receive your ROI in wallet instantly"].map((item) => (
              <li key={item} className="flex gap-2"><CircleCheck size={16} className="mt-0.5 shrink-0 text-emerald-500" />{item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
          <p className="font-bold">Need Help?</p>
          <p className="mt-2 text-sm text-[#475467]">Facing any issues while watching the video? Contact our support team.</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => navigate("/support")}>Contact Support</Button>
        </article>
      </section>

      <section className="mt-3 rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
        <p className="mb-3 font-bold">Today's Task History</p>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]">
              <tr>{["Date", "Task Title", "Duration", "Completion", "Status", "ROI", "Claim Status"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {tasks.slice(0, 6).map((row) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  <td className="py-3">{row.date}</td>
                  <td>{row.title}</td>
                  <td>{row.duration}</td>
                  <td>{row.completion}</td>
                  <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
                  <td>${money(row.roi)}</td>
                  <td><StatusBadge tone={row.claim === "Claimed" || row.claim === "Ready" ? "success" : "missed"}>{row.claim}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 lg:hidden">
          {tasks.slice(0, 4).map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{row.title}</p>
                <StatusBadge tone={row.status}>{row.status}</StatusBadge>
              </div>
              <p className="mt-1 text-xs text-[#667085]">{row.date} · {row.duration} · {row.completion}</p>
              <p className="mt-1 text-sm font-bold text-emerald-600">${money(row.roi)} · {row.claim}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
