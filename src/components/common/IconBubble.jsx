import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

export default function IconBubble({ children, className, size = "md" }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full", sizes[size], className)}>
      {children}
    </span>
  );
}

export function BalanceTile({ icon, iconClass, label, amount, hint }) {
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white px-3.5 py-3.5 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:px-4">
      <IconBubble className={iconClass} size="lg">
        {icon}
      </IconBubble>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-[#667085]">{label}</p>
        <p className="text-xl font-bold leading-tight tracking-tight text-[#101828] sm:text-[22px]">{amount}</p>
        {hint ? <p className="truncate text-xs text-[#98a2b3]">{hint}</p> : null}
      </div>
    </article>
  );
}
