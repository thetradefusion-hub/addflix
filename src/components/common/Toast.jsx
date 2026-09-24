import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

const icon = {
  success: CircleCheck,
  warning: TriangleAlert,
  info: Info,
};

export default function ToastStack() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-24 right-3 z-[80] flex w-[min(100%-1.5rem,22rem)] flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((item) => {
        const Icon = icon[item.tone] || CircleCheck;
        return (
          <div key={item.id} className="toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#eaecf0] bg-white px-4 py-3 shadow-xl">
            <Icon size={18} className={item.tone === "warning" ? "text-amber-500" : "text-emerald-500"} />
            <p className="flex-1 text-sm font-medium text-[#101828]">{item.message}</p>
            <button onClick={() => dismissToast(item.id)} aria-label="Dismiss notification" className="text-slate-400">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
