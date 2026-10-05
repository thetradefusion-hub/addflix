import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useApp } from "@/context/AppContext";
import ProfileMenu from "@/components/layout/ProfileMenu";

export default function MobileHeader({ onMenu }) {
  const navigate = useNavigate();
  const { unreadCount } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-[#f0f2f5] bg-white lg:hidden">
      <div className="relative flex h-16 items-center px-1.5">
        <button onClick={onMenu} className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#111]" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="pointer-events-none absolute top-0 left-1/2 flex h-16 w-[min(13rem,calc(100%-12.5rem))] -translate-x-1/2 items-center justify-center">
          <Logo light={false} className="h-[3.25rem]" />
        </div>
        <div className="relative z-10 ml-auto flex shrink-0 items-center">
          <ThemeToggle />
          <button onClick={() => navigate("/notifications")} className="relative grid h-10 w-10 place-items-center" aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e10600] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <ProfileMenu compact />
        </div>
      </div>
    </header>
  );
}
