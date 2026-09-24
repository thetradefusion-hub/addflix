export default function StatCard({ icon, iconBg = "bg-red-50 text-[#e10600]", label, value, hint, extra }) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3.5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[#667085]">{label}</p>
        <p className="truncate text-base font-bold text-[#101828]">{value}</p>
        {hint ? <p className="text-[11px] text-[#98a2b3]">{hint}</p> : null}
        {extra}
      </div>
    </article>
  );
}
