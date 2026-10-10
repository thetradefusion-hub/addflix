import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { displayReportValue, exportReportExcel, exportReportPdf } from "@/lib/reportExport";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import Pager, { usePaging } from "@/components/common/Pager";
import AppIcon from "@/components/common/AppIcon";

const icons = {
  members: "Users",
  wallets: "Wallet",
  activity: "ArrowLeftRight",
  deposits: "ArrowDownToLine",
  withdrawals: "ArrowUpFromLine",
  subscriptions: "CreditCard",
  investments: "Landmark",
  income: "BadgeDollarSign",
  level: "Layers",
  referrals: "UserPlus",
  tasks: "ListChecks",
};

function summaryText(item) {
  if (typeof item.value !== "number") return String(item.value);
  const text = item.value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return `$${text || "0"}`;
}

function toneFor(value) {
  const key = String(value || "").toLowerCase();
  if (key === "active" || key === "success" || key === "completed" || key === "credited") return key;
  if (key === "ready") return "success";
  if (key === "pending" || key === "processing") return key;
  if (key === "failed" || key === "inactive" || key === "missed") return key;
  if (key === "blocked") return "danger";
  return "info";
}

function cell(column, row) {
  const value = row[column.key];
  if (column.key === "status" || column.key === "subscription" || column.key === "claim") {
    return <StatusBadge tone={toneFor(value)}>{value || "—"}</StatusBadge>;
  }
  return displayReportValue(column, value);
}

export default function AdminReports({ onSessionExpired }) {
  const [catalog, setCatalog] = useState([]);
  const [type, setType] = useState("members");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/reports")
      .then((data) => setCatalog(data.reports || []))
      .catch((err) => {
        if (err.status === 401) onSessionExpired?.();
      });
  }, [onSessionExpired]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const search = params.toString();
    apiFetch(`/api/admin/reports/${type}${search ? `?${search}` : ""}`)
      .then((data) => {
        if (live) setReport(data.report);
      })
      .catch((err) => {
        if (!live) return;
        if (err.status === 401) onSessionExpired?.();
        else setError(err.message || "Unable to load this report.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [type, from, to, onSessionExpired]);

  const filtered = useMemo(() => {
    const rows = report?.rows || [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle)));
  }, [report, query]);

  const page = usePaging(filtered, 10, `${type}:${from}:${to}:${query}`);
  const columns = report?.columns || [];
  const canExport = filtered.length > 0 && !loading;

  const download = (kind) => {
    const payload = { title: report?.title || "Report", columns, rows: filtered, summary: report?.summary || [] };
    if (kind === "excel") exportReportExcel(payload);
    else exportReportPdf(payload);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {(catalog.length ? catalog : [{ id: type, title: "Members", detail: "Loading reports" }]).map((item) => {
          const active = item.id === type;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setType(item.id); setQuery(""); }}
              className={`rounded-2xl border p-3 text-left shadow-[0_8px_24px_rgba(16,24,40,0.04)] ${active ? "border-[#e10600] bg-red-50" : "border-[#eaecf0] bg-white hover:border-[#e10600]/40"}`}
            >
              <span className={`mb-2 grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-[#e10600] text-white" : "bg-red-50 text-[#e10600]"}`}>
                <AppIcon name={icons[item.id] || "FileBarChart"} size={16} />
              </span>
              <span className="block text-sm font-bold text-[#101828]">{item.title}</span>
              <span className="mt-1 block text-xs leading-5 text-[#667085]">{item.detail}</span>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-[#eaecf0] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            <label className="block text-xs font-semibold text-[#667085]">
              Search
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, status" className="mt-1 h-10 w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 text-sm font-medium text-[#101828] outline-none focus:border-[#e10600]" />
            </label>
            <label className={`block text-xs font-semibold text-[#667085] ${report?.dated === false ? "opacity-50" : ""}`}>
              From
              <input type="date" value={from} disabled={report?.dated === false} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 text-sm font-medium text-[#101828] outline-none focus:border-[#e10600] disabled:cursor-not-allowed" />
            </label>
            <label className={`block text-xs font-semibold text-[#667085] ${report?.dated === false ? "opacity-50" : ""}`}>
              To
              <input type="date" value={to} disabled={report?.dated === false} onChange={(event) => setTo(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 text-sm font-medium text-[#101828] outline-none focus:border-[#e10600] disabled:cursor-not-allowed" />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={!canExport} onClick={() => download("excel")}>Excel</Button>
            <Button type="button" size="sm" disabled={!canExport} onClick={() => download("pdf")}>PDF</Button>
          </div>
        </div>
        {report?.dated === false ? <p className="mt-2 text-xs text-[#98a2b3]">Wallet balances are the current snapshot, so the date range does not apply.</p> : null}
        {from || to ? (
          <button type="button" className="mt-2 text-xs font-semibold text-[#e10600]" onClick={() => { setFrom(""); setTo(""); }}>Clear dates</button>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {(report?.summary || []).map((item) => (
            <span key={item.label} className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#344054]">
              {item.label}: {summaryText(item)}
            </span>
          ))}
          {query.trim() ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[#e10600]">Matching: {filtered.length}</span> : null}
        </div>
        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {report?.truncated ? <p className="mt-3 text-xs text-[#b54708]">Showing the first 5,000 rows. Narrow the dates to export a smaller set.</p> : null}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eaecf0] text-xs uppercase tracking-wide text-[#98a2b3]">
                {columns.map((column) => <th key={column.key} className="px-2 py-2 font-semibold">{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={Math.max(columns.length, 1)} className="px-2 py-8 text-center text-[#667085]">Loading report…</td></tr>
              ) : page.items.length ? page.items.map((row, index) => (
                <tr key={`${row.memberId}-${row.date || ""}-${index}`} className="border-b border-[#f2f4f7]">
                  {columns.map((column) => <td key={column.key} className="max-w-[240px] truncate px-2 py-2.5 text-[#101828]">{cell(column, row)}</td>)}
                </tr>
              )) : (
                <tr><td colSpan={Math.max(columns.length, 1)} className="px-2 py-8 text-center text-[#667085]">No rows for this report.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page.page} pages={page.pages} total={page.total} size={page.size} onChange={page.setPage} />
      </section>
    </div>
  );
}
