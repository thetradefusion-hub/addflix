import { useEffect, useRef, useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#e10600] text-white shadow-sm hover:bg-[#c10500]",
        outline: "border border-[#e10600] bg-white text-[#e10600] hover:bg-red-50",
        ghost: "bg-white text-[#344054] border border-[#eaecf0] hover:bg-[#f8fafc]",
        dark: "bg-[#111827] text-white hover:bg-black",
        soft: "bg-red-50 text-[#e10600] hover:bg-red-100",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Spinner({ className }) {
  return <span className={cn("h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent", className)} aria-hidden="true" />;
}

export function Button({ className, variant, size, loading, disabled, onClick, children, ...props }) {
  const [running, setRunning] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);

  const handleClick = (event) => {
    const result = onClick?.(event);
    if (result && typeof result.then === "function") {
      setRunning(true);
      Promise.resolve(result).finally(() => {
        if (mounted.current) setRunning(false);
      });
    }
    return result;
  };

  const busy = Boolean(loading || running);
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      data-loading={busy ? "true" : undefined}
      onClick={onClick ? handleClick : undefined}
      {...props}
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}

export { buttonVariants };
