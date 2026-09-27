import { useEffect, useMemo, useRef, useState } from "react";
import { Gift, Play } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ProgressBar from "@/components/common/ProgressBar";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { money } from "@/lib/utils";
import Pager, { usePaging } from "@/components/common/Pager";

export default function WatchVideos() {
  const { markVideoWatched, toast } = useApp();
  const [videos, setVideos] = useState([]);
  const [watchedIds, setWatchedIds] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("new");
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const stop = () => clearInterval(timerRef.current);

  const load = async () => {
    const data = await apiFetch("/api/account/videos");
    setVideos(data.videos || []);
    setWatchedIds(data.watchedIds || []);
    setEarnings(data.earnings || []);
    setTodayCount(data.todayCount || 0);
  };

  useEffect(() => {
    load().catch((error) => toast(error.message, "warning"));
    return () => stop();
  }, []);

  const categories = ["All", ...new Set(videos.map((video) => video.category || "Promo"))];
  const list = useMemo(() => {
    let rows = videos.filter((video) => category === "All" || video.category === category);
    if (sort === "reward") rows = [...rows].sort((a, b) => b.reward - a.reward);
    return rows;
  }, [videos, category, sort]);
  const videoPage = usePaging(list, 8, `${category}:${sort}`);
  const earningPage = usePaging(earnings, 5, earnings.length);
  const todayEarned = earnings.filter((row) => watchedIds.includes(String(row.videoId))).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalEarned = earnings.reduce((sum, row) => sum + Number(row.amount || 0), 0);

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

  const finish = async () => {
    if (progress < 80 || !active) return;
    const ok = await markVideoWatched(active, progress);
    if (ok) {
      setActive(null);
      load().catch(() => {});
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Watch Videos & Earn" subtitle="Watch promotional videos, complete tasks and earn instant rewards in USDT." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Watch Videos" }, { label: "Earn" }]} />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          ["Today's Earnings", `$${money(todayEarned)}`, `${todayCount} completed`],
          ["Recent Rewards", `$${money(totalEarned)}`, "From this library"],
          ["Videos Watched", String(earnings.length), "Recent completions"],
          ["Library", String(videos.length), "Published by admin"],
        ].map(([label, value, hint]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="text-xl font-black">{value}</p>
            <p className="text-[11px] text-[#98a2b3]">{hint}</p>
          </article>
        ))}
        <article className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white">
          <p className="flex items-center gap-1 text-xs font-semibold"><Gift size={14} /> Daily Bonus</p>
          <p className="mt-1 text-sm font-bold">Reward is set on each video by admin</p>
          <p className="mt-2 text-lg font-black">{todayCount} today</p>
          <ProgressBar value={Math.min(100, todayCount * 20)} barClass="bg-white" />
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
        {list.length === 0 ? <p className="text-sm text-[#98a2b3]">No videos are published. Admin adds them in the video library.</p> : null}
        {videoPage.items.map((video) => (
          <article key={video.id} className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-sm">
            <div className="relative grid h-32 place-items-center overflow-hidden text-white">
              <img src={video.url || "/images/video-thumb.png"} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
              <Button className="mt-3 w-full" onClick={() => play(video)} disabled={watchedIds.includes(String(video.id))}>
                {watchedIds.includes(String(video.id)) ? "DONE TODAY" : "WATCH & EARN"}
              </Button>
            </div>
          </article>
        ))}
        <div className="sm:col-span-2 xl:col-span-4">
          <Pager page={videoPage.page} pages={videoPage.pages} total={videoPage.total} size={videoPage.size} onChange={videoPage.setPage} />
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <div className="flex items-center justify-between"><p className="font-bold">Today's Progress</p><span className="text-xs font-semibold text-[#e10600]">{todayCount} completed</span></div>
          <ProgressBar value={Math.min(100, todayCount * 20)} className="mt-3" />
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-sm text-[#475467]">
          <p className="font-bold text-[#101828]">Rules & Guidelines</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Watch complete video (minimum 80% duration).</li>
            <li>Do not skip or use multiple devices.</li>
            <li>Each video can be watched only once per day.</li>
            <li>Instant reward will be credited to your earning balance.</li>
            <li>Each published video can be completed once per day.</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="font-bold">Recent Video Earnings</p>
          <ul className="mt-2 space-y-2 text-sm">
            {earnings.length === 0 ? <li className="text-sm text-[#98a2b3]">No video rewards yet.</li> : null}
            {earningPage.items.map((row, index) => (
              <li key={`${row.videoId}-${index}`} className="flex items-center justify-between gap-2 border-b border-[#f2f4f7] py-1">
                <span className="truncate">{row.title}</span>
                <span className="shrink-0 font-semibold text-emerald-600">+{money(row.amount)}</span>
              </li>
            ))}
          </ul>
          <Pager page={earningPage.page} pages={earningPage.pages} total={earningPage.total} size={earningPage.size} onChange={earningPage.setPage} />
        </article>
      </section>

      <Modal
        open={Boolean(active)}
        title={active?.title || "Video"}
        onClose={() => { stop(); setActive(null); }}
        footer={<Button className="w-full" disabled={progress < 80} onClick={finish}>{progress < 80 ? "Keep watching" : "Complete & Earn"}</Button>}
      >
        <div className="relative mb-3 grid h-36 place-items-center overflow-hidden rounded-xl text-white">
          <img src={active?.url || "/images/video-thumb.png"} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <Play className="relative fill-white" />
        </div>
        <ProgressBar value={progress} />
        <p className="mt-2 text-xs">{progress}% watched · Reward +{money(active?.reward || 0)} USDT</p>
      </Modal>
    </div>
  );
}
