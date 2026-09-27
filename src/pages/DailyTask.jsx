import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, Clock3, Gauge, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ProgressBar from "@/components/common/ProgressBar";
import StatusBadge from "@/components/common/StatusBadge";
import TaskVideo from "@/components/task/TaskVideo";
import { useApp } from "@/context/AppContext";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";
import { parsePlayableUrl } from "@/lib/videoUrl";

function clock(total) {
  const seconds = Math.max(0, Math.floor(Number(total) || 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function DailyTask() {
  const { taskProgress, taskCompleted, roiClaimed, completeTask, reportPlayback, dailyTask, toast } = useApp();
  const navigate = useNavigate();
  const guard = useActiveGuard();
  const duration = dailyTask?.durationLocked ? Number(dailyTask.durationSeconds) || 0 : 0;
  const required = dailyTask?.requiredPercent || 95;
  const watched = dailyTask?.watchSeconds || 0;
  const playable = parsePlayableUrl(dailyTask?.videoUrl);
  const sampleRef = useRef(null);
  const finishing = useRef(false);
  const reportRef = useRef(reportPlayback);
  const completeRef = useRef(completeTask);
  const toastRef = useRef(toast);
  reportRef.current = reportPlayback;
  completeRef.current = completeTask;
  toastRef.current = toast;
  const [playerNote, setPlayerNote] = useState("");
  const [ahead, setAhead] = useState(false);
  const ready = taskProgress >= required;
  const current = taskCompleted ? 4 : ready ? 3 : taskProgress > 0 ? 1 : 1;
  const line = taskCompleted ? 100 : current <= 1 ? Math.max(8, taskProgress * 0.28) : current === 3 ? 66 : 100;
  const steps = [
    ["Watch Video", duration > 0 ? `Play the full video (${clock(duration)})` : "Play the full video", "Watch"],
    ["Completion", `Reach ${required}% watched`, "Complete"],
    ["Verification", "Skipped time is not counted", "Verify"],
    ["Task Complete", "Unlock ROI", "Unlock ROI"],
  ];

  useEffect(() => {
    if (!playable || taskCompleted) return undefined;
    let stopped = false;
    const send = async () => {
      const sample = sampleRef.current;
      if (!sample || stopped) return;
      if (sample.error) {
        setPlayerNote(sample.error);
        return;
      }
      const playing = Boolean(sample.playing) && document.visibilityState === "visible";
      try {
        const account = await reportRef.current({ position: sample.position, duration: sample.duration, playing });
        const task = account?.dailyTask;
        const counted = Number(task?.watchSeconds) || 0;
        setAhead(sample.position > counted + 4);
        if (stopped || finishing.current || task?.completed) return;
        if (task?.durationLocked && (task?.progress || 0) >= (task?.requiredPercent || 95)) {
          finishing.current = true;
          const ok = await completeRef.current();
          if (!ok) finishing.current = false;
        }
      } catch (error) {
        if (!stopped) toastRef.current(error.message, "warning");
      }
    };
    const id = setInterval(send, 1000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [playable?.kind, playable?.id, playable?.src, taskCompleted]);

  const finish = async () => {
    if (!guard()) return;
    if (!ready) return;
    finishing.current = true;
    const ok = await completeTask();
    if (!ok) finishing.current = false;
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="Daily Task"
        subtitle="Play today's video through to the end. ROI unlocks only after the required watch time."
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
        <article className="overflow-hidden rounded-2xl bg-[#07111f] text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
          <div className="relative aspect-video w-full bg-black">
            {taskCompleted ? (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <p className="text-lg font-black">Today's task is complete</p>
                  <p className="mt-1 text-sm text-white/70">ROI is unlocked. A new video opens with tomorrow's task.</p>
                </div>
              </div>
            ) : playable ? <TaskVideo url={dailyTask.videoUrl} allowedSeconds={watched} onSample={(sample) => { sampleRef.current = sample; }} /> : (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <p className="text-lg font-black">No task video yet</p>
                  <p className="mt-1 text-sm text-white/70">Admin adds a YouTube, Vimeo, or MP4 link, then presses Use today.</p>
                </div>
              </div>
            )}
          </div>
          {playerNote ? <p className="px-4 py-2 text-xs text-amber-200">{playerNote}</p> : null}
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[#101828]">{dailyTask?.title || "Watch Sponsored Video"}</p>
              <p className="text-xs text-[#667085]">{dailyTask?.subtitle || "Today's ROI video"}</p>
            </div>
            <StatusBadge tone="danger">Required</StatusBadge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              [Clock3, "bg-sky-50 text-sky-500", duration > 0 ? clock(duration) : "Full video", "Duration"],
              [CircleCheck, "bg-rose-50 text-rose-500", "Unlock ROI", "Reward"],
              [ShieldCheck, "bg-emerald-50 text-emerald-500", `Minimum ${required}%`, "Required Watch"],
              [Gauge, "bg-orange-50 text-orange-500", playable ? playable.kind : "Not set", "Video"],
            ].map(([Icon, color, value, label]) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-[#f8fafc] p-2.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${color}`}><Icon size={15} /></span>
                <span>
                  <span className="block text-xs font-bold capitalize text-[#101828]">{value}</span>
                  <span className="block text-[10px] text-[#98a2b3]">{label}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-[#101828]">Task Description</p>
          <p className="mt-1 text-sm leading-6 text-[#667085]">Press play and watch the video through. Forward skip is blocked, and the timer follows only the time that actually plays.</p>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm lg:col-start-1">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold">Watch Progress</p>
            <p className="text-sm font-bold text-[#344054]">{taskProgress}%</p>
          </div>
          <ProgressBar value={taskProgress} className="h-2.5" />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              [Clock3, "bg-sky-50 text-sky-500", "Counted time", clock(watched)],
              [Clock3, "bg-violet-50 text-violet-500", "Video length", duration > 0 ? clock(duration) : "Full video"],
              [Gauge, "bg-emerald-50 text-emerald-500", "Required", `${required}%`],
            ].map(([Icon, color, label, value]) => (
              <div key={label} className="rounded-xl border border-[#f2f4f7] bg-white p-3">
                <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${color}`}><Icon size={15} /></span>
                <p className="mt-1 text-[11px] text-[#98a2b3]">{label}</p>
                <p className="font-bold text-[#101828]">{value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={finish}
            disabled={taskCompleted || !ready}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e10600] text-sm font-bold text-white shadow-[0_8px_18px_rgba(225,6,0,0.28)] transition hover:bg-[#c10500] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CircleCheck size={16} />
            {taskCompleted ? "TASK COMPLETED ✓" : ready ? "MARK AS COMPLETE" : "WATCH THE VIDEO TO UNLOCK ROI"}
          </button>
          {taskCompleted ? (
            <button
              type="button"
              onClick={() => navigate("/roi")}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-[#e10600] bg-white text-sm font-bold text-[#e10600] transition hover:bg-[#fff5f5]"
            >
              {roiClaimed ? "View today's ROI" : "Claim ROI reward"}
            </button>
          ) : null}
          <p className="mt-2 text-center text-xs text-[#98a2b3]">
            {taskCompleted ? "Today's task is complete and ROI is unlocked." : ahead ? "Forward skip was pulled back. Watch from the counted time." : ready ? "Required watch reached. Mark the task to unlock today's ROI." : "Forward skip is blocked. Only playback at normal speed is counted."}
          </p>
        </article>

        <article className="rounded-2xl border border-rose-100 bg-[#fff5f5] p-4 lg:col-start-2">
          <p className="flex items-center gap-2 font-bold text-[#101828]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e10600] text-xs font-black text-white">!</span>
            Important
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#475467]">
            <li>Keep this page open while the video plays</li>
            <li>Pause or leaving the tab stops the timer</li>
            <li>Forward skip is blocked on the player</li>
            <li>Watch at least {required}% of the real video</li>
            <li>Then mark the task to unlock today's ROI</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
