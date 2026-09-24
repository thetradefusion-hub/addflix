import { useEffect, useMemo, useRef, useState } from "react";
import { Gift, Play } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ProgressBar from "@/components/common/ProgressBar";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { videoEarnings, videos } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { money } from "@/lib/utils";

export default function WatchVideos() {
  const { watched, watchEarnings, videosWatchedCount, bonusVideos, markVideoWatched } = useApp();
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("new");
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const stop = () => clearInterval(timerRef.current);

  useEffect(() => () => stop(), []);

  const categories = ["All", "Crypto", "Business", "Technology", "Education", "Health"];
  const list = useMemo(() => {
    let rows = videos.filter((video) => category === "All" || video.category === category);
    if (sort === "reward") rows = [...rows].sort((a, b) => b.reward - a.reward);
    return rows;
  }, [category, sort]);

  const play = (video) => {
    stop();
    setActive(video);
    setProgress(0);
    let value = 0;
    timerRef.current = setInterval(() => {
      value += 10;
      setProgress(Math.min(100, value));
      if (value >= 100) stop();
    }, 250);
  };

  const finish = () => {
    if (progress < 80) return;
    markVideoWatched(active);
    setActive(null);
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Watch Videos & Earn" subtitle="Watch promotional videos, complete tasks and earn instant rewards in USDT." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Watch Videos" }, { label: "Earn" }]} />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          ["Today's Earnings", `$${money(watchEarnings)}`, `${bonusVideos}/10 completed`],
          ["Total Earned", "$87.50", "Video rewards"],
          ["Videos Watched", String(videosWatchedCount), "All time"],
          ["Remaining Today", String(Math.max(0, 10 - bonusVideos)), "Slots left"],
        ].map(([label, value, hint]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="text-xl font-black">{value}</p>
            <p className="text-[11px] text-[#98a2b3]">{hint}</p>
          </article>
        ))}
        <article className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white">
          <p className="flex items-center gap-1 text-xs font-semibold"><Gift size={14} /> Daily Bonus</p>
          <p className="mt-1 text-sm font-bold">Earn extra $0.50 after watching 10 videos</p>
          <p className="mt-2 text-lg font-black">{bonusVideos} / 10</p>
          <ProgressBar value={bonusVideos * 10} barClass="bg-white" />
        </article>
      </section>

      <section className="mb-4 rounded-2xl bg-[#1a0b10] p-4 text-white">
        <p className="text-xl font-black">Watch • Learn • Earn</p>
        <p className="text-sm text-white/70">Watch short promotional videos and get rewarded instantly.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {["Real Ads", "Instant USDT Reward", "Daily Bonus", "No Investment Required"].map((item) => (
            <span key={item} className="rounded-full bg-white/10 px-3 py-1">{item}</span>
          ))}
        </div>
      </section>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-auto no-scrollbar">
          {categories.map((item) => {
            const count = item === "All" ? videos.length : videos.filter((video) => video.category === item).length;
            return (
              <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? "bg-[#e10600] text-white" : "bg-white"}`}>{item} ({count})</button>
            );
          })}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-xl border border-[#eaecf0] bg-white px-2 text-xs" aria-label="Sort videos">
          <option value="new">Sort by: Newest</option>
          <option value="reward">Sort by: Reward</option>
        </select>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((video) => (
          <article key={video.id} className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-sm">
            <div className="relative grid h-32 place-items-center overflow-hidden text-white">
              <img src="/images/video-thumb.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="relative grid h-10 w-10 place-items-center rounded-full bg-black/45">
                <Play className="fill-white" size={18} />
              </span>
              <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px]">{video.duration}</span>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold">{video.title}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-[#667085]">
                <span>{video.category}</span>
                <span className="font-bold text-emerald-600">+{money(video.reward)} USDT</span>
              </div>
              <Button className="mt-3 w-full" onClick={() => play(video)} disabled={Boolean(watched[video.id])}>
                {watched[video.id] ? "EARNED" : "WATCH & EARN"}
              </Button>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <div className="flex items-center justify-between"><p className="font-bold">Today's Progress</p><span className="text-xs font-semibold text-[#e10600]">{bonusVideos} / 10 Completed</span></div>
          <ProgressBar value={bonusVideos * 10} className="mt-3" />
          <div className="mt-3 grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`grid h-7 place-items-center rounded-md text-[10px] font-bold ${i < bonusVideos ? "bg-[#e10600] text-white" : "bg-slate-100 text-slate-400"}`}>{i + 1}</span>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-sm text-[#475467]">
          <p className="font-bold text-[#101828]">Rules & Guidelines</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Watch complete video (minimum 80% duration).</li>
            <li>Do not skip or use multiple devices.</li>
            <li>Each video can be watched only once per day.</li>
            <li>Instant reward will be credited to your earning balance.</li>
            <li>Complete 10 videos daily to get the bonus.</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="font-bold">Recent Video Earnings</p>
          <ul className="mt-2 space-y-2 text-sm">
            {videoEarnings.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 border-b border-[#f2f4f7] py-1">
                <span className="truncate">{row.title}</span>
                <span className="shrink-0 font-semibold text-emerald-600">+{money(row.amount)}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <Modal
        open={Boolean(active)}
        title={active?.title || "Video"}
        onClose={() => { stop(); setActive(null); }}
        footer={<Button className="w-full" disabled={progress < 80} onClick={finish}>{progress < 80 ? "Keep watching" : "Complete & Earn"}</Button>}
      >
        <div className="relative mb-3 grid h-36 place-items-center overflow-hidden rounded-xl text-white">
          <img src="/images/video-thumb.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <Play className="relative fill-white" />
        </div>
        <ProgressBar value={progress} />
        <p className="mt-2 text-xs">{progress}% watched · Reward +{money(active?.reward || 0)} USDT</p>
      </Modal>
    </div>
  );
}
