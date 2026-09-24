import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useApp } from "@/context/AppContext";

export default function MobileHeader({ onMenu }) {
  const navigate = useNavigate();
  const { unreadCount } = useApp();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#f0f2f5] bg-white px-3 lg:hidden">
      <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl text-[#111]" aria-label="Open menu">
        <Menu size={22} />
      </button>
      <Logo light={false} compact />
      <div className="ml-auto flex items-center gap-1">
        <button onClick={() => navigate("/notifications")} className="relative grid h-10 w-10 place-items-center" aria-label="Notifications">
          <Bell size={18} />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e10600] text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
        <button onClick={() => navigate("/profile")} aria-label="Profile" className="h-8 w-8 overflow-hidden rounded-full">
          <img src="/images/avatar-rahul.png" alt="" className="h-full w-full object-cover" />
        </button>
      </div>
    </header>
  );
}
