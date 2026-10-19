import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { money } from "@/lib/utils";
import AppIcon from "@/components/common/AppIcon";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";

function formatBv(value) {
  const n = Number(value) || 0;
  if (n >= 10_000_000) return `$${(n / 10_000_000).toFixed(n % 10_000_000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100_000) return `$${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 2)} Lac`;
  return `$${money(n)}`;
}

function RankBadge({ current, unlocked }) {
  if (current) {
    return <span className="salary-badge salary-badge-current">Current</span>;
  }
  if (unlocked) {
    return <span className="salary-badge salary-badge-unlocked">Unlocked</span>;
  }
  return <span className="salary-badge salary-badge-locked">Locked</span>;
}

export default function Salary() {
  const { toast, refreshSession, subscriptionActive } = useApp();
  const guard = useActiveGuard();
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/account/salary");
      setSalary(data.salary || null);
      if (data.creditedToday > 0) {
        toast(`$${money(data.creditedToday)} salary credited for today.`);
        refreshSession?.();
      }
    } catch (error) {
      toast(error.message || "Unable to load salary plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async () => {
    if (!guard()) return;
    if (salary?.claimedToday) return;
    setClaiming(true);
    try {
      const data = await apiFetch("/api/account/salary/claim", { method: "POST" });
      setSalary(data.salary || null);
      toast(data.message || "Salary credited.");
      refreshSession?.();
    } catch (error) {
      if (error?.data?.salary) setSalary(error.data.salary);
      toast(error.message || "Unable to claim salary.");
    } finally {
      setClaiming(false);
    }
  };

  const ranks = salary?.ranks || [];
  const currentId = Number(salary?.rank) || 0;
  const firstTarget = ranks[0]?.bv || 0;
  const claimedToday = Boolean(salary?.claimedToday);
  const canClaim = Boolean(salary?.canClaim);
  const nextProgress = salary?.nextRank
    ? Math.min(100, ((salary.bv || 0) / salary.nextRank.bv) * 100)
    : currentId
      ? 100
      : 0;

  const stats = [
    { icon: "CircleDollarSign", iconBg: "bg-rose-50 text-[#e10600]", label: "Matching BV", value: formatBv(salary?.bv || 0), hint: "min(Power, Second)" },
    { icon: "TrendingUp", iconBg: "bg-amber-50 text-amber-600", label: "Power Leg", value: formatBv(salary?.powerLeg || 0), hint: salary?.powerDirectId ? `${salary.powerDirectName || "Direct"} · ${salary.powerDirectId}` : "Strongest direct line" },
    { icon: "Users", iconBg: "bg-sky-50 text-sky-500", label: "Second Leg", value: formatBv(salary?.secondLeg || 0), hint: "All other directs combined" },
    { icon: "Crown", iconBg: "bg-violet-50 text-violet-500", label: "Current Rank", value: salary?.rankName || "None", hint: currentId ? `Rank ${currentId}` : (firstTarget ? `Need ${formatBv(firstTarget)} matching BV` : "No ranks configured") },
  ];

  return (
    <div className="salary-page mx-auto max-w-[1180px] space-y-4">
      <PageHeader
        title="Salary Plan"
        subtitle="Binary ranks from investment business volume. Power leg is your strongest direct line; second leg is the total of all other directs. Matching BV unlocks salary."
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Salary Plan" }]}
      />
      <InactiveBanner className="mb-0" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="salary-card flex items-start gap-3 rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.iconBg}`}>
              <AppIcon name={item.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium uppercase tracking-wide text-[#667085]">{item.label}</span>
              <span className="mt-0.5 block truncate text-xl font-black tracking-tight text-[#101828]">{loading ? "…" : item.value}</span>
              <span className="mt-1 block truncate text-[11px] text-[#98a2b3]">{item.hint}</span>
            </span>
          </article>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <article className="salary-hero relative overflow-hidden rounded-2xl bg-[linear-gradient(125deg,#14060a_0%,#7f1020_48%,#e10600_100%)] p-5 text-white shadow-[0_16px_36px_rgba(180,20,36,0.22)]">
          <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Daily salary</p>
              <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{loading ? "…" : `$${money(salary?.dailyAmount || 0)}`}</p>
              <p className="mt-1 text-sm text-white/75">
                {salary?.active ? `${salary.daysLeft} days left in this tenure` : "No active salary rank yet"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {claimedToday ? (
                <span className="theme-fixed inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)]">
                  <AppIcon name="CircleCheck" size={16} />
                  Already claimed
                </span>
              ) : (
                <button
                  type="button"
                  disabled={claiming || loading || !canClaim}
                  onClick={claim}
                  className="theme-fixed inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#e10600] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AppIcon name="HandCoins" size={16} />
                  {claiming ? "Claiming…" : "Claim today's salary"}
                </button>
              )}
              <button
                type="button"
                onClick={load}
                className="inline-flex h-11 items-center rounded-xl border border-white/35 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur"
              >
                Refresh BV
              </button>
            </div>
          </div>
          {claimedToday ? (
            <p className="relative z-[1] mt-3 text-xs text-white/70">Today&apos;s salary is already credited. Come back tomorrow.</p>
          ) : !subscriptionActive ? (
            <p className="relative z-[1] mt-3 text-xs text-white/70">Activate your subscription to claim salary.</p>
          ) : null}
        </article>

        <article className="salary-card rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#667085]">Tenure progress</p>
            <p className="text-sm font-bold text-[#101828]">
              {loading ? "…" : `${salary?.daysPaid || 0}`}
              <span className="font-medium text-[#98a2b3]"> / {salary?.tenure || 100} days</span>
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#f2f4f7]">
            <div
              className="h-full rounded-full bg-[#e10600] transition-[width] duration-500"
              style={{ width: `${Math.min(100, ((Number(salary?.daysPaid) || 0) / (Number(salary?.tenure) || 100)) * 100)}%` }}
            />
          </div>
          {salary?.nextRank ? (
            <div className="mt-4 border-t border-[#f2f4f7] pt-3">
              <p className="text-sm font-bold text-[#101828]">Next: {salary.nextRank.name}</p>
              <p className="mt-1 text-xs leading-5 text-[#667085]">
                Need {formatBv(salary.nextRank.need)} more matching BV for ${money(salary.nextRank.daily)}/day
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f2f4f7]">
                <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${nextProgress}%` }} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-[#98a2b3]">
              {currentId ? "Top rank reached for your current matching BV." : "Grow matching BV to unlock the first rank."}
            </p>
          )}
        </article>
      </section>

      <section className="salary-ranks rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] lg:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-bold text-[#101828]">Business Plan 2026 · Ranks</p>
            <p className="mt-0.5 text-xs text-[#98a2b3]">Matching BV unlocks each rank and starts a fresh 100-day tenure.</p>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="salary-table w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eaecf0] text-[11px] uppercase tracking-wide text-[#667085]">
                <th className="pb-3 pr-3 font-semibold">Rank</th>
                <th className="pb-3 pr-3 font-semibold">Name</th>
                <th className="pb-3 pr-3 text-right font-semibold">Matching BV</th>
                <th className="pb-3 pr-3 text-right font-semibold">Daily income</th>
                <th className="pb-3 pr-3 font-semibold">Tenure</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((row) => {
                const unlocked = currentId >= row.id;
                const current = currentId === row.id;
                return (
                  <tr key={row.id} className={`salary-row border-b border-[#f2f4f7] last:border-0 ${current ? "salary-row-current" : ""}`}>
                    <td className="py-3.5 pr-3 font-semibold text-[#667085]">{row.id}</td>
                    <td className="py-3.5 pr-3 font-semibold text-[#101828]">{row.name}</td>
                    <td className="py-3.5 pr-3 text-right tabular-nums text-[#344054]">{formatBv(row.bv)}</td>
                    <td className="py-3.5 pr-3 text-right font-bold tabular-nums text-emerald-600">${money(row.daily)}</td>
                    <td className="py-3.5 pr-3 text-[#475467]">{row.tenure} Days</td>
                    <td className="py-3.5"><RankBadge current={current} unlocked={unlocked} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 lg:hidden">
          {ranks.map((row) => {
            const unlocked = currentId >= row.id;
            const current = currentId === row.id;
            return (
              <article
                key={row.id}
                className={`rounded-xl border p-3.5 ${current ? "salary-row-current border-[#e10600]/40" : "border-[#eaecf0] bg-[#f8fafc]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-[#98a2b3]">Rank {row.id}</p>
                    <p className="font-bold text-[#101828]">{row.name}</p>
                  </div>
                  <RankBadge current={current} unlocked={unlocked} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <span>
                    <span className="block text-[#98a2b3]">BV</span>
                    <span className="font-semibold text-[#101828]">{formatBv(row.bv)}</span>
                  </span>
                  <span>
                    <span className="block text-[#98a2b3]">Daily</span>
                    <span className="font-bold text-emerald-600">${money(row.daily)}</span>
                  </span>
                  <span>
                    <span className="block text-[#98a2b3]">Tenure</span>
                    <span className="font-semibold text-[#101828]">{row.tenure}d</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <p className="salary-note mt-4 border-t border-[#f2f4f7] pt-3 text-xs leading-5 text-[#667085]">
          Binary BV: each direct line&apos;s business = that ID&apos;s investment packages + their downline packages. The strongest direct line is the Power Leg; all other directs add up as the Second Leg. Matching BV = the smaller of those two legs. Subscription amount is not counted. Growing to the next rank starts a new tenure.
        </p>
      </section>
    </div>
  );
}
