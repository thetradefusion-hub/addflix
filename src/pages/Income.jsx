import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Pager from "@/components/common/Pager";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import AppIcon from "@/components/common/AppIcon";
import { useApp } from "@/context/AppContext";
import { fineMoney, money, shortHash } from "@/lib/utils";
import { formatLedgerDate, lifetimeFigures, liveIncome, parseLedgerDate } from "@/lib/ledger";

const tabs = ["All Income", "ROI Income", "Referral Income", "Level Income", "Bonus Income", "Salary Income", "Other Income"];
const typeIcon = {
  "ROI Income": "HandCoins",
  "Referral Income": "Users",
  "Level Income": "Coins",
  "Bonus Income": "Gift",
  "Salary Income": "CircleDollarSign",
  "Other Income": "Coins",
};
function incomeText(value) {
  return String(value ?? "").replaceAll("ROI Income", "AdView income").replaceAll("ROI", "AdView income");
}

const pageCopy = {
  "All Income": ["Income History", "Every earning credited to this account."],
  "ROI Income": ["AdView income", "Daily AdView income credited after you claim today's task."],
  "Referral Income": ["Referral Income", "Commission credited when someone in your team activates. Your own ID must be active."],
  "Level Income": ["Level Income", "Level 1–15 commission on the daily AdView income your team claims. Your ID must be active and you need at least one direct referral."],
  "Bonus Income": ["Bonus", "Video rewards and other bonus credits on this account."],
  "Salary Income": ["Salary Income", "Daily rank salary from team investment business volume."],
  "Other Income": ["Other Income", "Any other credit that is not AdView income, referral, or bonus."],
};

const LEVEL_FILTERS = Array.from({ length: 15 }, (_, index) => index + 1);

function levelFromIncome(row) {
  const match = String(row?.description || "").match(/Level\s+(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function exportRows(rows, toast) {
  if (!rows.length) {
    toast("No income to export.");
    return;
  }
  const header = ["Date", "Type", "Description", "Amount", "Status", "TX"];
  const lines = [header, ...rows.map((row) => [formatLedgerDate(row.date), incomeText(row.type), incomeText(row.description), `$${Number(row.amount || 0).toFixed(2)}`, row.status, row.tx])];
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
  const [level, setLevel] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date");

  useEffect(() => {
    setTab(preset);
    setPage(1);
    if (preset !== "Level Income") setLevel(0);
  }, [preset]);

  const filtered = useMemo(() => {
    let rows = ledger.filter((row) => {
      const typeOk = tab === "All Income" || row.type === tab || (tab === "Bonus Income" && row.type === "Bonus Income") || (tab === "Other Income" && row.type === "Other Income");
      const statusOk = status === "All" || row.status === status;
      const levelOk = tab !== "Level Income" || !level || levelFromIncome(row) === level;
      const q = query.trim().toLowerCase();
      const searchOk = !q || `${row.description} ${row.tx} ${row.type}`.toLowerCase().includes(q);
      return typeOk && statusOk && levelOk && searchOk;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "amount") return Number(b.amount) - Number(a.amount);
      return (parseLedgerDate(b.date)?.getTime() || 0) - (parseLedgerDate(a.date)?.getTime() || 0);
    });
    return rows;
  }, [ledger, tab, status, level, query, sort]);

  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);
  const earned = lifetimeFigures(balances, referralCredits, income);
  const share = (value) => (earned.total > 0 ? `${((value / earned.total) * 100).toFixed(1)}%` : "0%");

  const openRow = (row) => toast(`${formatLedgerDate(row.date)} · ${incomeText(row.description)} · ${row.tx}`);

  return (
    <div className="mx-auto max-w-[1180px]">
      <h1 className="mb-3 text-lg font-semibold tracking-tight text-[#101828] lg:hidden">Income</h1>
      <div className="hidden lg:block">
        <PageHeader title={pageCopy[tab]?.[0] || "Income History"} crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Income", to: "/income" }, { label: pageCopy[tab]?.[0] || "Income" }]} />
      </div>

      <section className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {[
          ["Total Income", earned.total, "AdView income, referral and bonus", "from-rose-500 to-red-600 text-white", "BadgeDollarSign"],
          ["AdView income", earned.roi, share(earned.roi), "", "HandCoins"],
          ["Referral Income", earned.referral, share(earned.referral), "", "Users"],
          ["Bonus Income", earned.bonus, share(earned.bonus), "", "Gift"],
        ].map(([label, value, hint, tone, icon], index) => (
          <article key={label} className={`flex items-center gap-2 rounded-xl border border-[#eaecf0] px-2.5 py-2 lg:block lg:rounded-2xl lg:p-4 ${index === 0 ? `bg-gradient-to-br ${tone}` : "bg-white"}`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg lg:mb-2 lg:h-9 lg:w-9 lg:rounded-full ${index === 0 ? "bg-white/15 text-white" : "bg-red-50 text-[#e10600]"}`}><AppIcon name={icon} size={14} /></span>
            <span className="min-w-0">
              <span className={`block text-[11px] leading-tight lg:text-xs ${index === 0 ? "text-white/80" : "text-[#667085]"}`}>{label}</span>
              <span className="mt-1 block text-sm font-black leading-none lg:text-xl">${money(value)}</span>
              <span className={`mt-1 hidden text-[11px] lg:block ${index === 0 ? "text-white/70" : "text-emerald-600"}`}>{hint}</span>
            </span>
          </article>
        ))}
      </section>

      <section className="lg:rounded-2xl lg:border lg:border-[#eaecf0] lg:bg-white lg:p-4">
        <div className="-mx-3 mb-3 flex gap-2 overflow-x-auto px-3 no-scrollbar lg:mx-0 lg:px-0">
          {tabs.map((item) => (
            <button key={item} onClick={() => { setTab(item); setPage(1); if (item !== "Level Income") setLevel(0); }} className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold ${tab === item ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>{item === "ROI Income" ? "AdView income" : item.replace(" Income", "") === "All" ? "All" : item.replace(" Income", "")}</button>
          ))}
        </div>
        {tab === "Level Income" ? (
          <div className="-mx-3 mb-3 flex gap-1.5 overflow-x-auto px-3 no-scrollbar lg:mx-0 lg:flex-wrap lg:px-0">
            <button type="button" onClick={() => { setLevel(0); setPage(1); }} className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${level === 0 ? "bg-[#111827] text-white" : "bg-slate-100 text-[#475467]"}`}>All levels</button>
            {LEVEL_FILTERS.map((item) => (
              <button key={item} type="button" onClick={() => { setLevel(item); setPage(1); }} className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${level === item ? "bg-[#111827] text-white" : "bg-slate-100 text-[#475467]"}`}>L{item}</button>
            ))}
          </div>
        ) : null}
        <div className={`mb-3 space-y-2 lg:gap-2 lg:space-y-0 ${tab === "Level Income" ? "lg:grid lg:grid-cols-5" : "lg:grid lg:grid-cols-4"}`}>
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search income" className="h-10 w-full rounded-full border border-[#eaecf0] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#e10600] lg:rounded-xl" aria-label="Search income" />
          </label>
          {tab === "Level Income" ? (
            <select value={level} onChange={(e) => { setLevel(Number(e.target.value) || 0); setPage(1); }} className="hidden h-10 rounded-xl border border-[#eaecf0] bg-white px-3 text-sm outline-none focus:border-[#e10600] lg:block" aria-label="Level">
              <option value={0}>All levels</option>
              {LEVEL_FILTERS.map((item) => <option key={item} value={item}>Level {item}</option>)}
            </select>
          ) : null}
          <div className="flex gap-2 lg:contents">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 min-w-0 flex-1 rounded-full border border-[#eaecf0] bg-white px-3 text-xs outline-none focus:border-[#e10600] lg:rounded-xl lg:text-sm" aria-label="Status">
              {["All", "Credited", "Pending"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 min-w-0 flex-1 rounded-full border border-[#eaecf0] bg-white px-3 text-xs outline-none focus:border-[#e10600] lg:rounded-xl lg:text-sm" aria-label="Sort">
              <option value="date">Newest</option>
              <option value="amount">Amount</option>
            </select>
            <button type="button" aria-label="Export" onClick={() => exportRows(filtered, toast)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eaecf0] bg-white text-[#e10600] lg:hidden">
              <Download size={16} />
            </button>
            <Button variant="outline" className="hidden lg:inline-flex" onClick={() => exportRows(filtered, toast)}>Export</Button>
          </div>
        </div>
        {view.length === 0 ? <EmptyState title="No income found" body={tab === "Level Income" && level ? `No Level ${level} credits yet. Try All levels or another filter.` : "Change the type, status, or search text."} /> : (
          <>
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[#667085]"><tr>{["#", "Date & Time", "Income Type", "Description", "Amount", "Status", "TX ID", "Action"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {view.map((row, index) => (
                    <tr key={row.id} className="border-t border-[#f2f4f7]">
                      <td className="py-3">{(page - 1) * pageSize + index + 1}</td>
                      <td>{formatLedgerDate(row.date)}</td>
                      <td>{incomeText(row.type)}</td>
                      <td>{incomeText(row.description)}</td>
                      <td className="font-semibold text-emerald-600">+${fineMoney(row.amount)}</td>
                      <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
                      <td>{shortHash(row.tx, 8, 4)}</td>
                      <td><button className="text-xs font-semibold text-[#e10600]" onClick={() => openRow(row)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white lg:hidden">
              {view.map((row) => (
                <button key={row.id} type="button" onClick={() => openRow(row)} className="flex w-full items-center gap-3 border-b border-[#f2f4f7] px-3 py-3 text-left last:border-b-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><AppIcon name={typeIcon[row.type] || "Coins"} size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[#101828]">{row.type === "ROI Income" ? "AdView income" : row.type.replace(" Income", "")}</span>
                      <span className="shrink-0 text-sm font-bold text-emerald-600">+${fineMoney(row.amount)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[#667085]">{incomeText(row.description)}</span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#98a2b3]">{formatLedgerDate(row.date)}</span>
                      <StatusBadge tone={row.status}>{row.status}</StatusBadge>
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <Pager page={page} pages={pages} total={filtered.length} size={pageSize} onChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
