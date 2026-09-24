export default function Logo({ light = true, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e10600] shadow-[0_8px_16px_rgba(225,6,0,0.35)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5-11-6.5z" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={`block text-[15px] font-extrabold tracking-wide ${light ? "text-white" : "text-[#111]"}`}>
          ADD<span className="text-[#e10600]">FLIX</span>
        </span>
        {compact ? null : (
          <span className={`mt-1 block text-[10px] ${light ? "text-white/55" : "text-[#98a2b3]"}`}>Watch • Promote • Earn</span>
        )}
      </span>
    </div>
  );
}
