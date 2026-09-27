import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  ChevronDown,
  FileText,
  Headphones,
  LayoutDashboard,
  PieChart,
  CreditCard,
  LogOut,
  Mail,
  Menu,
  Play,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { to: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine },
  { to: "/admin/plans", label: "Plans", icon: PieChart },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/tickets", label: "Tickets", icon: Headphones },
  { to: "/admin/fraud", label: "Fraud", icon: ShieldAlert },
  { to: "/admin/videos", label: "Videos", icon: Play },
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/audit", label: "Audit", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const mobileItems = items.filter((item) => ["Overview", "Users", "Withdrawals", "Tickets", "Settings"].includes(item.label));

function NavItems({ onNavigate }) {
  return items.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
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
      </NavLink>
    );
  });
}

function AdminSidebar({ onLogout, onNavigate, className = "" }) {
  return (
    <aside className={cn("flex h-full w-[248px] shrink-0 flex-col bg-[#0c0e13] text-white", className)}>
      <div className="px-5 pb-4 pt-5">
        <Logo />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Admin</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
        <NavItems onNavigate={onNavigate} />
      </nav>
      <div className="p-3">
        <button
          onClick={() => {
            onLogout();
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

function AdminTopHeader({ user }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openLang, setOpenLang] = useState(false);
  const [lang, setLang] = useState("English");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  return (
    <header className="hidden h-[68px] items-center gap-4 bg-[#0c0e13] px-5 lg:flex">
      <div className="relative max-w-xl flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search admin pages..."
          aria-label="Search admin pages"
          className="h-10 w-full rounded-full border border-white/10 bg-[#1a1d24] pl-10 pr-4 text-sm text-white outline-none placeholder:text-[#98a2b3] focus:border-white/20"
        />
        {query.trim() ? (
          <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-[#eaecf0] bg-white py-1 shadow-xl">
            {results.length ? results.map((item) => (
              <button
                key={item.to}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => {
                  navigate(item.to);
                  setQuery("");
                }}
              >
                {item.label}
              </button>
            )) : <p className="px-4 py-2 text-sm text-[#667085]">No pages found</p>}
          </div>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Admin alerts" onClick={() => navigate("/admin/messages")}>
          <Bell size={18} />
        </button>
        <div className="relative">
          <button className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-white" onClick={() => setOpenLang((value) => !value)}>
            {lang} <ChevronDown size={14} />
          </button>
          {openLang ? (
            <div className="absolute right-0 top-10 z-30 w-36 rounded-xl border border-[#eaecf0] bg-white py-1 text-sm text-[#101828] shadow-xl">
              {["English", "Hindi"].map((item) => (
                <button key={item} className="block w-full px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setLang(item); setOpenLang(false); }}>
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e10600] text-sm font-black">A</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{user?.fullName || "ADD FLIX Admin"}</span>
            <span className="block text-[11px] text-white/55">ID: {user?.referralId || "ADD0001"}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

export default function AdminShell({ user, onLogout, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-dvh overflow-hidden bg-[#f4f6f8]">
      <AdminSidebar className="hidden lg:flex" onLogout={onLogout} />
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <AdminSidebar className="relative z-10 shadow-2xl" onLogout={onLogout} onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopHeader user={user} />
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#f0f2f5] bg-white px-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl text-[#111]" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <Logo light={false} compact />
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-24 sm:px-4 lg:px-5 lg:pb-6">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eaecf0] bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(16,24,40,0.06)] lg:hidden" aria-label="Admin mobile">
        <ul className="grid grid-cols-5">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => cn("flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-[#98a2b3]", isActive && "text-[#e10600]")}
                >
                  <Icon size={20} strokeWidth={2.25} />
                  {item.label === "Withdrawals" ? "Payouts" : item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
