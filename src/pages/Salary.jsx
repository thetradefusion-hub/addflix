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
    setClaiming(true);
    try {
      const data = await apiFetch("/api/account/salary/claim", { method: "POST" });
      setSalary(data.salary || null);
      toast(data.message || "Salary credited.");
      refreshSession?.();
    } catch (error) {
      toast(error.message || "Unable to claim salary.");
    } finally {
      setClaiming(false);
    }
  };

  const ranks = salary?.ranks || [];
  const currentId = Number(salary?.rank) || 0;
  const firstTarget = ranks[0]?.bv || 0;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="Salary Plan"
        subtitle="Binary ranks from investment business volume. Power leg is your strongest direct line; second leg is the total of all other directs. Matching BV unlocks salary."
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Salary Plan" }]}
      />
      <InactiveBanner className="mb-3" />

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Matching BV", formatBv(salary?.bv || 0), "min(Power, Second)"],
          ["Power Leg", formatBv(salary?.powerLeg || 0), salary?.powerDirectId ? `${salary.powerDirectName || "Direct"} · ${salary.powerDirectId}` : "Strongest direct line"],
          ["Second Leg", formatBv(salary?.secondLeg || 0), "All other directs combined"],
          ["Current Rank", salary?.rankName || "None", currentId ? `Rank ${currentId}` : (firstTarget ? `Need ${formatBv(firstTarget)} matching BV` : "No ranks configured")],
        ].map(([label, value, hint]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="mt-1 text-xl font-black text-[#101828]">{loading ? "…" : value}</p>
            <p className="mt-1 truncate text-[11px] text-[#98a2b3]">{hint}</p>
          </article>
        ))}
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="text-xs text-[#667085]">Daily Salary</p>
          <p className="mt-1 text-xl font-black text-[#101828]">{loading ? "…" : `$${money(salary?.dailyAmount || 0)}`}</p>
          <p className="mt-1 text-[11px] text-[#98a2b3]">{salary?.active ? `${salary.daysLeft} days left` : "Not active"}</p>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="text-xs text-[#667085]">Days Paid</p>
          <p className="mt-1 text-xl font-black text-[#101828]">{loading ? "…" : String(salary?.daysPaid || 0)}</p>
          <p className="mt-1 text-[11px] text-[#98a2b3]">of {salary?.tenure || 100}</p>
        </article>
      </section>

      {salary?.nextRank ? (
        <article className="mb-4 rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="text-sm font-bold text-[#101828]">Next: {salary.nextRank.name}</p>
          <p className="mt-1 text-sm text-[#667085]">
            Need {formatBv(salary.nextRank.need)} more matching BV (target {formatBv(salary.nextRank.bv)}) for ${money(salary.nextRank.daily)}/day.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2f4f7]">
            <div
              className="h-full rounded-full bg-[#e10600]"
              style={{ width: `${Math.min(100, ((salary.bv || 0) / salary.nextRank.bv) * 100)}%` }}
            />
          </div>
        </article>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={claiming || loading || !salary?.active}
          onClick={claim}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#e10600] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AppIcon name="HandCoins" size={16} />
          {claiming ? "Claiming…" : "Claim today's salary"}
        </button>
        <button type="button" onClick={load} className="h-11 rounded-xl border border-[#eaecf0] bg-white px-4 text-sm font-semibold text-[#344054]">
          Refresh BV
        </button>
        {!subscriptionActive ? <p className="text-xs text-[#667085]">Activate your subscription to claim salary.</p> : null}
      </div>

      <section className="rounded-2xl border border-[#eaecf0] bg-white p-3 lg:p-4">
        <p className="mb-3 font-bold text-[#101828]">Business Plan 2026 · Ranks</p>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]">
              <tr>
                {["Rank", "Name", "Matching BV needed", "Daily income", "Tenure", "Status"].map((h) => (
                  <th key={h} className="pb-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranks.map((row) => {
                const unlocked = currentId >= row.id;
                const current = currentId === row.id;
                return (
                  <tr key={row.id} className={`border-t border-[#f2f4f7] ${current ? "bg-red-50/60" : ""}`}>
                    <td className="py-3 font-semibold">{row.id}</td>
                    <td className="font-semibold text-[#101828]">{row.name}</td>
                    <td>{formatBv(row.bv)}</td>
                    <td className="font-bold text-emerald-600">${money(row.daily)}</td>
                    <td>{row.tenure} Days</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${unlocked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-[#667085]"}`}>
                        {current ? "Current" : unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </td>
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
              <article key={row.id} className={`rounded-xl border p-3 ${current ? "border-[#e10600] bg-red-50/50" : "border-[#eaecf0] bg-[#f8fafc]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-[#667085]">Rank {row.id}</p>
                    <p className="font-bold text-[#101828]">{row.name}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${unlocked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-[#667085]"}`}>
                    {current ? "Current" : unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#475467]">BV {formatBv(row.bv)} · ${money(row.daily)}/day · {row.tenure} days</p>
              </article>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[#667085]">
          Binary BV: each direct line&apos;s business = that ID&apos;s investment packages + their downline packages. The strongest direct line is the Power Leg; all other directs add up as the Second Leg. Matching BV = the smaller of those two legs. Subscription amount is not counted. Growing to the next rank starts a new tenure.
        </p>
      </section>
    </div>
  );
}
