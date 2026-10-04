import { CalendarOff } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function useOffDay() {
  const { roiDay, roiClaimed } = useApp();
  return {
    off: Boolean(roiDay?.allOff) && !roiClaimed,
    partial: !roiDay?.allOff && (roiDay?.offPlans || []).length > 0,
    roiDay,
  };
}

export default function OffDayBanner({ className = "mb-4" }) {
  const { off, partial, roiDay } = useOffDay();
  if (!off && !partial) return null;
  const plans = (roiDay.offPlans || []).join(", ");
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-violet-300 bg-white p-3 text-sm shadow-sm ${className}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500 text-white"><CalendarOff size={18} /></span>
      <span>
        <span className="block font-bold text-[#101828]">{off ? `${roiDay.weekday} is an ROI off day` : `${plans} ${roiDay.offPlans.length === 1 ? "has" : "have"} no ROI on ${roiDay.weekday}`}</span>
        <span className="block text-xs text-[#667085]">
          {off
            ? `Your plan does not pay ROI today, so there is no task to watch.${roiDay.resumesOn ? ` Task and ROI resume on ${roiDay.resumesOn}.` : ""}`
            : "Today's ROI comes only from your other active plans."}
        </span>
      </span>
    </div>
  );
}
