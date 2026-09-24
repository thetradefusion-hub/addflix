import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  FileBarChart,
  Headphones,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PieChart,
  Play,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import Logo from "./Logo";
import { navItems } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const icons = {
  LayoutDashboard,
  CreditCard,
  PieChart,
  ListChecks,
  CircleDollarSign,
  Play,
  DollarSign,
  UserPlus,
  Users,
  Wallet,
  FileBarChart,
  Bell,
  Headphones,
  UserRound,
};

function Item({ item, onNavigate }) {
  const location = useLocation();
  const active = Boolean(item.children?.some((child) => location.pathname === child.to));
  const [open, setOpen] = useState(active);
  const { unreadCount } = useApp();
  const Icon = icons[item.icon];

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-white/75 transition hover:bg-white/5 hover:text-white",
            active && "text-white"
          )}
        >
          <Icon size={18} strokeWidth={2.25} />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown size={14} className={cn("transition", open && "rotate-180")} />
        </button>
        {open ? (
          <div className="ml-9 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/5 hover:text-white",
                    isActive && "bg-[#e10600] text-white hover:bg-[#e10600]"
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const badge = item.icon === "Bell" ? unreadCount : 0;

  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-white/75 transition hover:bg-white/5 hover:text-white",
          isActive && "bg-[#e10600] text-white shadow-[0_8px_18px_rgba(225,6,0,0.35)] hover:bg-[#e10600]"
        )
      }
    >
      <Icon size={18} strokeWidth={2.25} />
      <span className="flex-1">{item.label}</span>
      {badge > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#e10600] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export default function Sidebar({ onNavigate, className = "" }) {
  const navigate = useNavigate();
  const { toast } = useApp();
  return (
    <aside className={cn("flex h-full w-[248px] shrink-0 flex-col bg-[#0c0e13] text-white", className)}>
      <div className="px-5 pb-4 pt-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {navItems.map((item) => (
          <Item key={item.label} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="p-3">
        <button
          onClick={() => {
            toast("You have been logged out of the demo.", "info");
            navigate("/dashboard");
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-white/75 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} strokeWidth={2.25} />
          Logout
        </button>
      </div>
    </aside>
  );
}
