export default function ProgressBar({ value = 0, className = "", barClass = "bg-[#e10600]" }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-[#eceff3] ${className}`} role="progressbar" aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-300 ${barClass}`} style={{ width: `${width}%` }} />
    </div>
  );
}
