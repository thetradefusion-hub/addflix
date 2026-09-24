import { Home, ListChecks, PieChart, UserRound, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/daily-task", label: "Task", icon: ListChecks },
  { to: "/investment", label: "Invest", icon: PieChart },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eaecf0] bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(16,24,40,0.06)] lg:hidden" aria-label="Mobile">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn("flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-[#98a2b3]", isActive && "text-[#e10600]")
                }
              >
                <Icon size={20} strokeWidth={2.25} />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
