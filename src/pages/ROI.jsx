import { Lock } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useApp } from "@/context/AppContext";
import { money } from "@/lib/utils";
import Pager, { usePaging } from "@/components/common/Pager";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";
import OffDayBanner, { useOffDay } from "@/components/common/OffDayBanner";

function clock(total) {
  const seconds = Math.max(0, Math.floor(Number(total) || 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function ROI() {
  const { taskProgress, taskCompleted, roiUnlocked, roiClaimed, tasks, claimRoi, watching, todayRoi, dailyTask, roiDay } = useApp();
  const guard = useActiveGuard();
  const { off: offToday } = useOffDay();
  const progress = taskCompleted || roiClaimed ? 100 : taskProgress;
  const duration = Number(dailyTask?.durationSeconds) || 0;
  const watched = taskCompleted || roiClaimed ? (duration || Number(dailyTask?.watchSeconds) || 0) : Number(dailyTask?.watchSeconds) || 0;
  const taskPage = usePaging(tasks, 8, tasks.length);
  const progressNote = roiClaimed
    ? "Today's ROI has been credited."
    : offToday
      ? `No task on ${roiDay?.weekday || "today"}.`
      : progress >= (dailyTask?.requiredPercent || 95)
        ? "Required watch is done. Claim today's ROI."
        : "Keep watching until the video completes to unlock your ROI.";

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="Daily ROI / Claim"
        subtitle="Claim today's ROI after the task is complete."
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Daily ROI" }]}
      />
      <InactiveBanner />
      <OffDayBanner />

      <section className="grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-5 text-center shadow-sm">
          <p className="font-bold">Task Progress</p>
          <div className="relative mx-auto my-4 grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(#e10600 ${progress}%, #f2f4f7 0)` }}>
            <div className="grid h-[6.5rem] w-[6.5rem] place-items-center rounded-full bg-white text-2xl font-black">{progress}%</div>
          </div>
          <p className="text-sm font-semibold">{roiClaimed ? "Credited" : watching ? "Watching..." : roiUnlocked || taskCompleted ? "Ready to claim" : "Not started"}</p>
          <p className="mt-1 text-xs text-[#667085]">Watched Time {clock(watched)} / {duration > 0 ? clock(duration) : "--:--"}</p>
          <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-[#667085]">{progressNote}</p>
        </article>

        <article className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-[#3a0d14] to-[#e10600] p-5 text-center text-white">
          <p className="text-sm font-semibold">Today's ROI Status</p>
          <p className="mt-2 text-4xl font-black">${money(todayRoi)}</p>
          <p className="mt-3 inline-flex items-center justify-center gap-1 self-center rounded-full bg-black/20 px-3 py-1 text-xs font-bold">
            <Lock size={12} /> {roiClaimed ? "CLAIMED" : offToday ? "OFF DAY" : roiUnlocked ? "UNLOCKED" : "LOCKED"}
          </p>
          <p className="mt-3 text-xs text-white/80">{roiClaimed ? "Today's ROI has been credited to your wallet." : offToday ? `No ROI on ${roiDay?.weekday}.${roiDay?.resumesOn ? ` It resumes on ${roiDay.resumesOn}.` : ""}` : roiUnlocked ? "Your ROI is ready to claim." : "Complete today's activity to unlock your ROI."}</p>
          <button onClick={() => { if (!guard()) return; claimRoi(); }} disabled={roiClaimed || offToday || !roiUnlocked} className="theme-fixed mt-4 h-11 w-full rounded-xl bg-white font-bold text-[#e10600] disabled:opacity-70">
            {roiClaimed ? "CLAIMED" : offToday ? "ROI OFF TODAY" : "CLAIM TODAY'S ROI"}
          </button>
        </article>
      </section>

      <section className="mt-3 rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
        <p className="mb-3 font-bold">Today's Task History</p>
        {taskPage.total === 0 ? <p className="py-6 text-center text-sm text-[#98a2b3]">No task history yet.</p> : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[#667085]">
                  <tr>{["Date", "Task Title", "Duration", "Completion", "Status", "ROI", "Claim Status"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {taskPage.items.map((row) => (
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
              {taskPage.items.map((row) => (
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
            <Pager page={taskPage.page} pages={taskPage.pages} total={taskPage.total} size={taskPage.size} onChange={taskPage.setPage} />
          </>
        )}
      </section>
    </div>
  );
}
