import { useEffect, useMemo, useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Pie, PieChart } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import Pager from "@/components/common/Pager";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import AppIcon from "@/components/common/AppIcon";
import { useApp } from "@/context/AppContext";
import { money, shortHash } from "@/lib/utils";
import { formatLedgerDate, incomeByDay, lifetimeFigures, liveIncome, parseLedgerDate } from "@/lib/ledger";

const tabs = ["All Income", "ROI Income", "Referral Income", "Bonus Income", "Other Income"];
const pageCopy = {
  "All Income": ["Income History", "Every earning credited to this account."],
  "ROI Income": ["ROI Income", "Daily ROI credited after you claim today's task."],
  "Referral Income": ["Referral Income", "Commission credited when someone in your team activates."],
  "Bonus Income": ["Bonus", "Video rewards and other bonus credits on this account."],
  "Other Income": ["Other Income", "Any other credit that is not ROI, referral, or bonus."],
};

function exportRows(rows, toast) {
  if (!rows.length) {
    toast("No income to export.");
    return;
  }
  const header = ["Date", "Type", "Description", "Amount", "Status", "TX"];
  const lines = [header, ...rows.map((row) => [formatLedgerDate(row.date), row.type, row.description, row.amount, row.status, row.tx])];
  const csv = lines.map((cols) => cols.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "addflix-income.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast("Income file downloaded.");
}

export default function Income({ preset = "All Income" }) {
  const { income, toast, balances, referralCredits } = useApp();
  const ledger = liveIncome(income);
  const [tab, setTab] = useState(preset);
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date");
  const [range, setRange] = useState("30");

  useEffect(() => {
    setTab(preset);
    setPage(1);
  }, [preset]);

  const filtered = useMemo(() => {
    let rows = ledger.filter((row) => {
      const typeOk = tab === "All Income" || row.type === tab || (tab === "Bonus Income" && row.type === "Bonus Income") || (tab === "Other Income" && row.type === "Other Income");
      const statusOk = status === "All" || row.status === status;
      const q = query.trim().toLowerCase();
      const searchOk = !q || `${row.description} ${row.tx} ${row.type}`.toLowerCase().includes(q);
      return typeOk && statusOk && searchOk;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "amount") return Number(b.amount) - Number(a.amount);
      return (parseLedgerDate(b.date)?.getTime() || 0) - (parseLedgerDate(a.date)?.getTime() || 0);
    });
    return rows;
  }, [ledger, tab, status, query, sort]);

  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);
  const earned = lifetimeFigures(balances, referralCredits, income);
  const slices = [
    { name: "ROI Income", value: earned.roi, color: "#3b82f6" },
    { name: "Referral Income", value: earned.referral, color: "#e10600" },
    { name: "Bonus Income", value: earned.bonus, color: "#f59e0b" },
    { name: "Other Income", value: earned.other, color: "#a855f7" },
  ].filter((slice) => slice.value > 0);
  const chart = incomeByDay(income, range === "7" ? 7 : 30);
  const share = (value) => (earned.total > 0 ? `${((value / earned.total) * 100).toFixed(1)}%` : "0%");

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title={pageCopy[tab]?.[0] || "Income History"} subtitle={pageCopy[tab]?.[1]} crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Income", to: "/income" }, { label: pageCopy[tab]?.[0] || "Income" }]} />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          ["Total Income", earned.total, "ROI, referral and bonus", "from-rose-500 to-red-600 text-white", "BadgeDollarSign"],
          ["ROI Income", earned.roi, share(earned.roi), "", "HandCoins"],
          ["Referral Income", earned.referral, share(earned.referral), "", "Users"],
          ["Bonus Income", earned.bonus, share(earned.bonus), "", "Gift"],
          ["Other Income", earned.other, share(earned.other), "", "Coins"],
        ].map(([label, value, hint, tone, icon], index) => (
          <article key={label} className={`rounded-2xl border border-[#eaecf0] p-4 ${index === 0 ? `bg-gradient-to-br ${tone}` : "bg-white"}`}>
            <span className={`mb-2 grid h-9 w-9 place-items-center rounded-full ${index === 0 ? "bg-white/15 text-white" : "bg-red-50 text-[#e10600]"}`}><AppIcon name={icon} size={16} /></span>
            <p className={`text-xs ${index === 0 ? "text-white/80" : "text-[#667085]"}`}>{label}</p>
            <p className="text-xl font-black">${money(value)}</p>
            <p className={`text-[11px] ${index === 0 ? "text-white/70" : "text-emerald-600"}`}>{hint}</p>
          </article>
        ))}
      </section>

      <section className="mb-4 grid gap-3 lg:grid-cols-[1.4fr_0.7fr]">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold">Income Overview</p>
            <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-lg border border-[#eaecf0] px-2 py-1 text-xs" aria-label="Chart range">
              <option value="30">Last 30 Days</option>
              <option value="7">Last 7 Days</option>
            </select>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart}>
                <CartesianGrid stroke="#f2f4f7" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={range === "7" ? 0 : 4} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area dataKey="roi" stroke="#3b82f6" fill="#3b82f633" />
                <Bar dataKey="referral" fill="#e10600" radius={[3, 3, 0, 0]} />
                <Bar dataKey="bonus" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="other" fill="#a855f7" radius={[3, 3, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="font-bold">Income Distribution</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices.length ? slices : [{ name: "None", value: 1, color: "#e4e7ec" }]} dataKey="value" innerRadius={48} outerRadius={70}>
                  {(slices.length ? slices : [{ name: "None", value: 1, color: "#e4e7ec" }]).map((slice) => <Cell key={slice.name} fill={slice.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm font-bold">${money(earned.total)} total income</p>
          <ul className="mt-2 space-y-1 text-xs">
            {(slices.length ? slices : []).map((slice) => (
              <li key={slice.name} className="flex justify-between"><span>{slice.name}</span><span>{share(slice.value)}</span></li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-[#eaecf0] bg-white p-4">
        <div className="mb-3 flex gap-2 overflow-auto no-scrollbar">
          {tabs.map((item) => (
            <button key={item} onClick={() => { setTab(item); setPage(1); }} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${tab === item ? "bg-[#e10600] text-white" : "bg-slate-100"}`}>{item.replace(" Income", "") === "All" ? "All" : item.replace(" Income", "")}</button>
          ))}
        </div>
        <div className="mb-3 grid gap-2 sm:grid-cols-4">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search description or TX" className="h-10 rounded-xl border border-[#eaecf0] px-3 text-sm" aria-label="Search income" />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-[#eaecf0] px-3 text-sm" aria-label="Status">
            {["All", "Credited", "Pending"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-xl border border-[#eaecf0] px-3 text-sm" aria-label="Sort">
            <option value="date">Newest</option>
            <option value="amount">Highest amount</option>
          </select>
          <Button variant="outline" onClick={() => exportRows(filtered, toast)}>Export</Button>
        </div>
        {view.length === 0 ? <EmptyState title="No income found" body="Change the type, status, or search text." /> : (
          <>
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[#667085]"><tr>{["#", "Date & Time", "Income Type", "Description", "Amount", "Status", "TX ID", "Action"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {view.map((row, index) => (
                    <tr key={row.id} className="border-t border-[#f2f4f7]">
                      <td className="py-3">{(page - 1) * pageSize + index + 1}</td>
                      <td>{formatLedgerDate(row.date)}</td>
                      <td>{row.type}</td>
                      <td>{row.description}</td>
                      <td className="font-semibold text-emerald-600">+{money(row.amount)}</td>
                      <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
                      <td>{shortHash(row.tx, 8, 4)}</td>
                      <td><button className="text-xs font-semibold text-[#e10600]" onClick={() => toast(`${formatLedgerDate(row.date)} · ${row.description} · ${row.tx}`)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 lg:hidden">
              {view.map((row) => (
                <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{row.type}</p>
                      <p className="text-xs text-[#667085]">{row.description}</p>
                    </div>
                    <p className="font-bold text-emerald-600">+{money(row.amount)} USDT</p>
                  </div>
                  <p className="mt-1 text-[11px] text-[#98a2b3]">{formatLedgerDate(row.date)}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusBadge tone={row.status}>{row.status}</StatusBadge>
                    <span className="text-[11px] text-[#98a2b3]">{shortHash(row.tx, 8, 4)}</span>
                  </div>
                </article>
              ))}
            </div>
            <Pager page={page} pages={pages} total={filtered.length} size={pageSize} onChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
