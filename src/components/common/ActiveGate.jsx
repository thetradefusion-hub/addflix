import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

export function useActiveGuard() {
  const { subscriptionActive, toast } = useApp();
  const navigate = useNavigate();
  return () => {
    if (subscriptionActive) return true;
    toast("Activate your $10 USDT subscription to use this feature.", "warning");
    navigate("/subscription");
    return false;
  };
}

export default function InactiveBanner({ className = "mb-4" }) {
  const { subscriptionActive } = useApp();
  const navigate = useNavigate();
  if (subscriptionActive) return null;
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-sm text-[#9f1239]">Your ID is not active. Pay $10 USDT to unlock daily task, ROI claim, investment and withdrawals.</p>
      <Button size="sm" onClick={() => navigate("/subscription")}>Activate Subscription</Button>
    </div>
  );
}
