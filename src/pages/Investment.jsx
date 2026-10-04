import { useEffect, useState } from "react";
import { CircleCheck, Crown, Diamond, Gem, Star } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ProgressBar from "@/components/common/ProgressBar";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import AppIcon from "@/components/common/AppIcon";
import { useApp } from "@/context/AppContext";
import { money, roiDaysLabel } from "@/lib/utils";
import Pager, { usePaging } from "@/components/common/Pager";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";

const icons = { blue: Diamond, red: Crown, purple: Gem, amber: Star };
const colors = {
  blue: "from-sky-500 to-blue-600",
  red: "from-[#e10600] to-rose-600",
  purple: "from-violet-500 to-purple-600",
  amber: "from-amber-500 to-orange-600",
};

export default function Investment() {
  const { balances, toast, investments, investInPlan, plans } = useApp();
  const guard = useActiveGuard();
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState("standard");
  const [amount, setAmount] = useState(100);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const planPage = usePaging(investments, 8, investments.length);
  useEffect(() => {
    if (!plans.length) return;
    if (!plans.some((plan) => plan.id === selectedId)) {
      setSelectedId(plans.find((plan) => plan.popular)?.id || plans[0].id);
    }
  }, [plans, selectedId]);
  const selected = plans.find((plan) => plan.id === selectedId) || plans[0] || null;
  const activeRows = investments.filter((row) => row.status === "Active");
  const featured = activeRows[0] || null;
  const totalInvested = investments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalEarned = investments.reduce((sum, row) => sum + Number(row.earnedRoi || 0), 0);
  const visible = plans.filter((plan) => {
    if (filter === "Active") return investments.some((row) => row.planId === plan.id && row.status === "Active");
    if (filter === "Completed") return investments.some((row) => row.planId === plan.id && row.status === "Completed");
    return true;
  });
  const daily = selected ? (amount * selected.dailyRoi) / 100 : 0;
  const cap = selected ? (amount * selected.maxRoi) / 100 : 0;
  const projected = selected ? Math.min(daily * selected.validity, cap) : 0;
  const progress = featured && featured.cap ? Math.min(100, (featured.earnedRoi / featured.cap) * 100) : 0;
  const statIcons = [
    ["Active Plan", featured ? featured.planName : "None", featured ? "Active" : "", "Crown", "bg-violet-50 text-violet-500"],
    ["Total Investment", `$${money(totalInvested)}`, "", "Landmark", "bg-sky-50 text-sky-500"],
    ["Total ROI Earned", `$${money(totalEarned)}`, "", "HandCoins", "bg-emerald-50 text-emerald-500"],
    ["Total Plans", String(investments.length), "", "PieChart", "bg-amber-50 text-amber-500"],
  ];

  const confirmInvest = async () => {
    if (!guard()) return;
    if (!selected) return;
    if (!amount || amount < selected.min) {
      toast(`Minimum for ${selected.name} is $${selected.min} USDT.`, "warning");
      return;
    }
    setBusy(true);
    const ok = await investInPlan(selected.id, amount);
    setBusy(false);
    if (ok) setOpen(false);
  };

  const openPlan = (plan) => {
    if (!guard()) return;
    setSelectedId(plan.id);
    setAmount(plan.min);
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <PageHeader
        title="My Plan / Investment"
        subtitle="Choose the best plan and start earning daily ROI with ad watching tasks."
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "My Plan" }]}
      />
      <InactiveBanner />

      <article className="overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#14060a_0%,#7f1020_52%,#e10600_100%)] p-5 text-white shadow-[0_16px_36px_rgba(180,20,36,0.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.16em] text-white/70">ACTIVE PLAN</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Crown size={18} />
              </span>
              <h2 className="text-2xl font-black tracking-tight">{featured ? featured.planName : "No active plan"}</h2>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{featured ? "Active" : "Waiting"}</span>
            </div>
            <p className="mt-2 text-sm text-white/80">
              {featured
                ? `$${money(featured.amount)} USDT · Started ${featured.startDate} · Daily ROI $${money(featured.dailyAmount)}${activeRows.length > 1 ? ` · ${activeRows.length} active plans` : ""}`
                : "Buy a plan to start daily ROI. The amount is debited from your wallet."}
            </p>
          </div>
          <div className="w-full max-w-sm rounded-2xl bg-black/20 p-4">
            <div className="mb-2 flex items-end justify-between text-sm">
              <span className="text-white/75">ROI progress</span>
              <span className="font-bold">${money(featured?.earnedRoi || 0)} / ${money(featured?.cap || 0)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="theme-fixed h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/70">{featured ? `${Math.round(progress)}% of the $${money(featured.cap)} cap · ${featured.validityDays} day validity` : "ROI stops when the plan cap is reached."}</p>
          </div>
        </div>
      </article>

      <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {statIcons.map(([label, value, badge, icon, iconBg]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className={`mb-2 grid h-9 w-9 place-items-center rounded-full ${iconBg}`}><AppIcon name={icon} size={16} /></span>
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="truncate text-lg font-black tracking-tight">{value}</p>
            {badge ? <StatusBadge tone="active">{badge}</StatusBadge> : null}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">Available Plans</p>
            <p className="text-xs text-[#98a2b3]">Daily ROI is credited after the video task.</p>
          </div>
          <div className="flex gap-1">
            {["All", "Active", "Completed"].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-[#111827] text-white" : "bg-[#f2f4f7] text-[#475467]"}`}>{item === "All" ? "All Plans" : item}</button>
            ))}
          </div>
        </div>
        {visible.length === 0 ? <p className="py-10 text-center text-sm text-[#98a2b3]">{plans.length === 0 ? "Plans will appear when the catalog is published." : "No completed plans in this view."}</p> : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visible.map((plan) => {
            const Icon = icons[plan.accent] || Crown;
            const held = investments.some((row) => row.planId === plan.id && row.status === "Active");
            return (
              <article key={plan.id} className={`flex flex-col overflow-hidden rounded-2xl border bg-white ${plan.popular ? "border-[#e10600] shadow-[0_12px_28px_rgba(225,6,0,0.12)]" : "border-[#eaecf0]"}`}>
                <div className={`h-1.5 bg-gradient-to-r ${colors[plan.accent]}`} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ${colors[plan.accent]}`}>
                      <Icon size={18} />
                    </span>
                    {plan.popular ? <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-[#e10600]">Most Popular</span> : null}
                  </div>
                  <p className="mt-3 font-bold">{plan.name}</p>
                  <p className="text-3xl font-black tracking-tight">{plan.dailyRoi}%</p>
                  <p className="text-xs text-[#667085]">Daily ROI · from ${plan.min}</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-[#475467]">
                    <li className="flex items-center gap-1.5"><CircleCheck size={14} className="text-emerald-500" /> Maximum ROI {plan.maxRoi}%</li>
                    <li className="flex items-center gap-1.5"><CircleCheck size={14} className="text-emerald-500" /> Validity {plan.validity} days</li>
                    <li className="flex items-center gap-1.5"><CircleCheck size={14} className="text-emerald-500" /> {roiDaysLabel(plan.offDays)}</li>
                    <li className="flex items-center gap-1.5"><CircleCheck size={14} className="text-emerald-500" /> Watch a video each day</li>
                  </ul>
                  <button
                    onClick={() => openPlan(plan)}
                    className={`mt-4 h-11 w-full rounded-xl text-sm font-bold text-white bg-gradient-to-r ${colors[plan.accent]}`}
                  >
                    {held ? "Invest Again" : "Invest Now →"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm sm:p-5">
          <p className="font-bold">Invest in Plan</p>
          <label className="mt-4 block text-xs font-semibold text-[#667085]">Select Plan</label>
          <select className="mt-1.5 h-12 w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600] focus:bg-white" value={selected?.id || ""} onChange={(e) => {
            const plan = plans.find((p) => p.id === e.target.value);
            if (!plan) return;
            setSelectedId(plan.id);
            setAmount(plan.min);
          }}>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} (Min ${plan.min})</option>)}
          </select>
          <label className="mt-3 block text-xs font-semibold text-[#667085]">Investment Amount (USDT)</label>
          <input type="number" min={selected?.min || 0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1.5 h-12 w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600] focus:bg-white" />
          <p className="mt-2 text-xs text-[#667085]">Wallet balance ${money(balances.total)} · BEP-20 (BSC)</p>
          <Button className="mt-4 w-full" onClick={() => { if (!guard()) return; setOpen(true); }}>Proceed to Invest →</Button>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">{selected?.name || "Plan"}</p>
            <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white ${colors[selected?.accent] || colors.red}`}>
              {(() => { const Icon = icons[selected?.accent] || Crown; return <Icon size={16} />; })()}
            </span>
          </div>
          <ul className="space-y-2 text-sm text-[#475467]">
            {[
              ["Minimum", `$${selected?.min || 0} USDT`],
              ["Daily ROI", `${selected?.dailyRoi || 0}% after the task`],
              ["Maximum ROI", `${selected?.maxRoi || 0}%`],
              ["Validity", `${selected?.validity || 0} days`],
              ["ROI days", roiDaysLabel(selected?.offDays).replace("ROI ", "")],
              ["Task", "Watch the sponsored video"],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <span className="text-[#667085]">{label}</span>
                <span className="text-right font-semibold text-[#101828]">{value}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-[linear-gradient(165deg,#064e3b_0%,#059669_100%)] p-5 text-white shadow-[0_16px_32px_rgba(5,150,105,0.22)]">
          <p className="text-[11px] font-bold tracking-[0.14em] text-white/75">ESTIMATED EARNING</p>
          <p className="mt-2 text-4xl font-black tracking-tight">${money(projected || 0)}</p>
          <p className="mt-1 text-sm text-white/80">in {selected?.validity || 0} {selected?.offDays?.length ? "ROI days" : "days"} if every task is completed</p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-white/15 px-3 py-3">
              <p className="text-[11px] text-white/70">Amount</p>
              <p className="font-bold">${money(amount || 0)}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-3">
              <p className="text-[11px] text-white/70">Daily ROI</p>
              <p className="font-bold">${money(daily || 0)}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-bold">My Plans</p>
            <p className="text-xs text-[#98a2b3]">${money(totalEarned)} earned across {investments.length} plan{investments.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <ProgressBar value={progress} barClass="bg-emerald-500" />
        <div className="mt-4 hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]">
              <tr>{["#", "Plan Name", "Amount", "Start Date", "Daily ROI", "Total ROI", "Earned ROI", "Status", "Action"].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {investments.length === 0 ? <tr><td colSpan={9} className="py-8 text-center text-sm text-[#98a2b3]">No plans yet. Choose a plan above.</td></tr> : null}
              {planPage.items.map((row, index) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  <td className="py-3 pr-3">{planPage.start + index + 1}</td>
                  <td className="pr-3 font-semibold">{row.planName}</td>
                  <td className="pr-3">${money(row.amount)}</td>
                  <td className="pr-3">{row.startDate}</td>
                  <td className="pr-3">{row.dailyRate}%</td>
                  <td className="pr-3">${money(row.cap)}</td>
                  <td className="pr-3">${money(row.earnedRoi)}</td>
                  <td className="pr-3"><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
                  <td><button className="rounded-lg border border-[#e10600] px-2.5 py-1 text-xs font-semibold text-[#e10600]" onClick={() => setDetail(row)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-2 lg:hidden">
          {investments.length === 0 ? <p className="py-6 text-center text-sm text-[#98a2b3]">No plans yet. Choose a plan above.</p> : null}
          {planPage.items.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
              <div className="flex items-center justify-between gap-2"><p className="font-semibold">{row.planName}</p><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="mt-1 text-sm">${money(row.amount)} · Daily {row.dailyRate}%</p>
              <p className="text-xs text-[#667085]">Earned ${money(row.earnedRoi)} / ${money(row.cap)} · {row.startDate}</p>
            </article>
          ))}
        </div>
        <Pager page={planPage.page} pages={planPage.pages} total={planPage.total} size={planPage.size} onChange={planPage.setPage} />
      </section>

      <Modal
        open={open}
        title="Confirm Investment"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={busy} onClick={confirmInvest}>{busy ? "Processing..." : "Confirm"}</Button>
          </>
        }
      >
        <p>Invest <b>${money(amount || 0)} USDT</b> in <b>{selected?.name}</b>? This amount leaves your wallet now. Daily ROI is ${money(daily || 0)} after each completed task, and it stops at the ${money(cap || 0)} cap.</p>
      </Modal>
      <Modal open={Boolean(detail)} title={detail?.planName || "Plan"} onClose={() => setDetail(null)}>
        {detail ? (
          <ul className="space-y-2 text-sm text-[#475467]">
            {[
              ["Amount", `$${money(detail.amount)}`],
              ["Daily ROI", `${detail.dailyRate}% · $${money(detail.dailyAmount)}`],
              ["Earned", `$${money(detail.earnedRoi)} / $${money(detail.cap)}`],
              ["Started", detail.startDate],
              ["Status", detail.status],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <span className="text-[#667085]">{label}</span>
                <span className="font-semibold text-[#101828]">{value}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </div>
  );
}
