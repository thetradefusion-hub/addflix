import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";
import ToastStack from "@/components/common/Toast";

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-dvh overflow-hidden bg-[#f4f6f8]">
      <Sidebar className="hidden lg:flex" />
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <Sidebar className="relative z-10 shadow-2xl" onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <MobileHeader onMenu={() => setOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-24 sm:px-4 lg:px-5 lg:pb-6">
          <Outlet />
          <nav className="mx-auto mt-6 flex max-w-[1180px] flex-wrap gap-x-3 gap-y-1 pb-2 text-[11px] text-[#98a2b3]">
            {[
              ["/legal/about", "About"],
              ["/legal/how-it-works", "How it works"],
              ["/legal/earning-rules", "Earning rules"],
              ["/legal/faq", "FAQ"],
              ["/legal/terms", "Terms"],
              ["/legal/privacy", "Privacy"],
              ["/legal/disclaimer", "Disclaimer"],
              ["/legal/contact", "Contact"],
            ].map(([to, label]) => (
              <Link key={to} to={to} className="hover:text-[#e10600]">{label}</Link>
            ))}
          </nav>
        </main>
      </div>
      <MobileBottomNav />
      <ToastStack />
    </div>
  );
}
