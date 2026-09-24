import { CircleCheck, Clock3, Gauge, Settings, ShieldCheck, Volume2 } from "lucide-react";
import { Play } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ProgressBar from "@/components/common/ProgressBar";
import StatusBadge from "@/components/common/StatusBadge";
import { useApp } from "@/context/AppContext";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";

const steps = [
  ["Watch Video", "Watch full video (2 Minutes)", "Watch"],
  ["Completion", "Reach 100% watch", "Complete"],
  ["Verification", "System will verify", "Verify"],
  ["Task Complete", "Unlock ROI", "Unlock ROI"],
];

export default function DailyTask() {
  const { taskProgress, watching, taskCompleted, startTask, completeTask } = useApp();
  const guard = useActiveGuard();
  const play = () => { if (!guard()) return; startTask(); };
  const current = taskCompleted ? 4 : taskProgress >= 95 ? 3 : taskProgress > 0 ? 1 : 1;
  const seconds = Math.floor((taskProgress / 100) * 120);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const line = taskCompleted ? 100 : current <= 1 ? Math.max(8, taskProgress * 0.28) : current === 3 ? 66 : 100;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="Daily Task"
        subtitle="Watch the complete video to complete today's task and unlock your ROI."
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Daily Task", to: "/daily-task" }, { label: "Watch Video" }]}
      />
      <InactiveBanner />

      <section className="mb-4 rounded-2xl border border-[#eaecf0] bg-white px-3 py-4 shadow-sm sm:px-6">
        <div className="relative grid grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-4 h-0.5 bg-[#f2f4f7]" />
          <div className="absolute left-[12%] top-4 h-0.5 bg-[#e10600] transition-all" style={{ width: `${line * 0.76}%` }} />
          {steps.map(([title, body, short], index) => {
            const n = index + 1;
            const on = taskCompleted || n <= current;
            return (
              <div key={title} className="relative z-10 text-center">
                <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-bold ring-4 ring-white ${on ? "bg-[#e10600] text-white" : "bg-[#eef2f6] text-[#98a2b3]"}`}>{n}</span>
                <p className="mt-2 hidden text-sm font-semibold text-[#101828] sm:block">{title}</p>
                <p className="mt-2 text-[11px] font-semibold text-[#101828] sm:hidden">{short}</p>
                <p className="mx-auto mt-0.5 hidden max-w-[140px] text-[11px] leading-4 text-[#98a2b3] lg:block">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <article className="overflow-hidden rounded-2xl bg-[#07111f] text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] lg:row-span-1">
          <div className="relative grid min-h-[230px] place-items-center overflow-hidden sm:min-h-[340px]">
            <img src="/images/task-video.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
            <div className="relative z-10 mr-auto max-w-[240px] px-6 text-left sm:max-w-sm sm:px-10">
              <p className="text-[28px] font-black leading-[0.95] tracking-tight sm:text-5xl">DRIVE<br />THE NEXT<br />GENERATION</p>
              <p className="mt-2 text-[10px] font-semibold tracking-[0.22em] text-white/70 sm:text-xs">PREMIUM ELECTRIC CARS</p>
              <p className="mt-3 text-sm font-black tracking-wide text-sky-300">AUTOX <span className="text-[10px] font-medium tracking-[0.18em] text-white/50">FUTURE OF MOBILITY</span></p>
            </div>
            <button
              onClick={play}
              disabled={taskCompleted}
              className="absolute z-20 grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[#111] shadow-xl transition hover:scale-105 disabled:opacity-70"
              aria-label="Start task video"
            >
              <Play className="ml-1 fill-[#111]" size={26} />
            </button>
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 bg-black/45 px-3 py-2.5 text-xs backdrop-blur-sm">
              <button onClick={play} aria-label={watching ? "Pause" : "Play"} className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                <Play size={12} className="ml-0.5 fill-white" />
              </button>
              <span className="tabular-nums">{mm}:{ss} / 2:00</span>
              <ProgressBar value={taskProgress} className="h-1.5 flex-1 bg-white/20" />
              <Volume2 size={14} className="hidden sm:block" />
              <Settings size={14} className="hidden sm:block" />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0f172a] text-[10px] font-black leading-none text-white">AUTO<br />X</span>
              <div>
                <p className="font-bold text-[#101828]">Watch Sponsored Video</p>
                <p className="text-xs text-[#667085]">Premium Electric Cars</p>
              </div>
            </div>
            <StatusBadge tone="danger">Required</StatusBadge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              [Clock3, "bg-sky-50 text-sky-500", "2 Minutes", "Duration"],
              [CircleCheck, "bg-rose-50 text-rose-500", "Unlock ROI", "Reward"],
              [ShieldCheck, "bg-emerald-50 text-emerald-500", "Minimum 95%", "Required Watch"],
              [Gauge, "bg-orange-50 text-orange-500", "Automobile / Ad", "Category"],
            ].map(([Icon, color, value, label]) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-[#f8fafc] p-2.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${color}`}><Icon size={15} /></span>
                <span>
                  <span className="block text-xs font-bold text-[#101828]">{value}</span>
                  <span className="block text-[10px] text-[#98a2b3]">{label}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-[#101828]">Task Description</p>
          <p className="mt-1 text-sm leading-6 text-[#667085]">Watch this short promotional video completely to unlock your today's ROI. Keep the video in focus until it finishes.</p>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm lg:col-start-1">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-bold">Watch Progress</p>
              <p className="text-sm font-bold text-[#344054]">{taskProgress}%</p>
            </div>
            <ProgressBar value={taskProgress} className="h-2.5" />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                [Clock3, "bg-sky-50 text-sky-500", "Watched Time", `${mm}:${ss}`],
                [Clock3, "bg-violet-50 text-violet-500", "Total Duration", "02:00"],
                [Gauge, "bg-emerald-50 text-emerald-500", "Required Completion", "95%"],
              ].map(([Icon, color, label, value]) => (
                <div key={label} className="rounded-xl border border-[#f2f4f7] bg-white p-3">
                  <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${color}`}><Icon size={15} /></span>
                  <p className="mt-1 text-[11px] text-[#98a2b3]">{label}</p>
                  <p className="font-bold text-[#101828]">{value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={taskProgress === 0 ? play : completeTask}
              disabled={taskCompleted || (taskProgress > 0 && taskProgress < 95)}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e10600] text-sm font-bold text-white shadow-[0_8px_18px_rgba(225,6,0,0.28)] transition hover:bg-[#c10500] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CircleCheck size={16} />
              {taskCompleted ? "TASK COMPLETED ✓" : taskProgress === 0 ? "START TASK" : watching ? "MARK AS COMPLETE" : "MARK AS COMPLETE"}
            </button>
            <p className="mt-2 text-center text-xs text-[#98a2b3]">
              {taskCompleted ? "Today's task is complete and ROI is unlocked." : taskProgress >= 95 ? "Video complete. Mark the task to unlock today's ROI." : "Please watch the full video to enable the complete button."}
            </p>
        </article>

        <article className="rounded-2xl border border-rose-100 bg-[#fff5f5] p-4 lg:col-start-2">
            <p className="flex items-center gap-2 font-bold text-[#101828]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e10600] text-xs font-black text-white">!</span>
              Important
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#475467]">
              <li>Keep the video in focus</li>
              <li>Do not minimize the window</li>
              <li>Do not use multiple accounts</li>
              <li>Complete the full 2 minutes</li>
              <li>After completion click “Mark as Complete”</li>
            </ul>
        </article>
      </section>
    </div>
  );
}
