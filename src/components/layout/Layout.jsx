import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";
import ToastStack from "@/components/common/Toast";
import { useApp } from "@/context/AppContext";

const prefetchPages = () => Promise.all([
  import("@/pages/Dashboard"),
  import("@/pages/DailyTask"),
  import("@/pages/ROI"),
  import("@/pages/Wallet"),
  import("@/pages/Income"),
  import("@/pages/Referral"),
]).catch(() => {});

function AccountSkeleton() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-4" role="status" aria-label="Loading your account">
      <div className="h-8 w-56 skeleton-block animate-pulse rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => <div key={key} className="h-28 skeleton-block animate-pulse rounded-xl" />)}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-64 skeleton-block animate-pulse rounded-xl lg:col-span-2" />
        <div className="h-64 skeleton-block animate-pulse rounded-xl" />
      </div>
      <p className="text-center text-sm text-[#667085]">Loading your account…</p>
    </div>
  );
}

function SessionError({ message, onRetry }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-md rounded-xl border border-[#fecdca] bg-white p-6 text-center">
      <p className="font-semibold text-[#101828]">Could not load your account</p>
      <p className="mt-1 text-sm text-[#667085]">{message}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          onRetry().catch(() => {}).finally(() => setBusy(false));
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#e10600] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
        Try again
      </button>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { accountReady, sessionError, refreshSession } = useApp();
  const impersonating = localStorage.getItem("addflix_impersonating") === "1";

  useEffect(() => {
    if (!accountReady) return undefined;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const handle = idle(prefetchPages);
    return () => cancel(handle);
  }, [accountReady]);
  return (
    <div className="app-canvas flex h-dvh overflow-hidden bg-[#f4f6f8]">
      <Sidebar className="hidden lg:flex" />
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <Sidebar className="relative z-10 shadow-2xl" onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {impersonating ? (
          <div className="flex items-center justify-between gap-3 bg-[#111827] px-4 py-2 text-xs text-white">
            <span>You are viewing this member account as admin.</span>
            <Link to="/admin/users" className="font-bold text-[#ffb4b0]">Back to admin</Link>
          </div>
        ) : null}
        <TopHeader />
        <MobileHeader onMenu={() => setOpen(true)} />
        <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-24 sm:px-4 lg:px-5 lg:pb-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(225,6,0,0.12),transparent_68%)]" />
          <div className="relative">
          {accountReady ? <Outlet /> : sessionError ? <SessionError message={sessionError} onRetry={() => refreshSession()} /> : <AccountSkeleton />}
          <nav className="mx-auto mt-8 flex max-w-[1180px] flex-wrap gap-x-3 gap-y-1 pb-2 text-[11px] text-[#98a2b3]">
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
          </div>
        </main>
      </div>
      <MobileBottomNav />
      <ToastStack />
    </div>
  );
}
