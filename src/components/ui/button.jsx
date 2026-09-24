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

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
