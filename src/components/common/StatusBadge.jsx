import { cn } from "@/lib/utils";

const tones = {
  success: "bg-emerald-50 text-emerald-600",
  completed: "bg-emerald-50 text-emerald-600",
  active: "bg-emerald-50 text-emerald-600",
  credited: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-sky-50 text-sky-600",
  danger: "bg-red-50 text-red-600",
  locked: "bg-red-50 text-red-600",
  missed: "bg-rose-50 text-rose-600",
  failed: "bg-red-50 text-red-600",
  inactive: "bg-slate-100 text-slate-500",
  info: "bg-sky-50 text-sky-600",
  review: "bg-orange-50 text-orange-600",
};

export default function StatusBadge({ children, tone = "info", className }) {
  const key = String(tone || children || "info").toLowerCase();
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[key] || tones.info, className)}>
      {children}
    </span>
  );
}
