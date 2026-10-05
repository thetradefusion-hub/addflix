import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function ProfileMenu({ compact = false, onOpen }) {
  const navigate = useNavigate();
  const { sessionUser, logout } = useApp();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const name = sessionUser?.name || "Member";
  const email = sessionUser?.email || "—";
  const phone = sessionUser?.phone || "—";

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const toggle = () => {
    setOpen((value) => {
      const next = !value;
      if (next) onOpen?.();
      return next;
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Account menu"
        onClick={toggle}
        className={compact ? "h-8 w-8 overflow-hidden rounded-full" : "flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-left text-white hover:bg-white/5"}
      >
        <img src="/images/avatar-rahul.png" alt="" className={compact ? "h-full w-full object-cover" : "h-9 w-9 rounded-full object-cover"} />
        {compact ? null : (
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{name}</span>
            <span className="block text-[11px] text-white/55">ID: {sessionUser?.id || "—"}</span>
          </span>
        )}
      </button>
      {open ? (
        <div role="dialog" aria-label="Account" className="absolute right-0 top-12 z-30 w-72 rounded-2xl border border-[#eaecf0] bg-white p-3 text-[#101828] shadow-xl">
          <div className="flex items-center gap-3">
            <img src="/images/avatar-rahul.png" alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-[11px] text-[#667085]">ID: {sessionUser?.id || "—"}</p>
            </div>
          </div>
          <dl className="mt-3 space-y-2 border-t border-[#f2f4f7] pt-3">
            <div>
              <dt className="text-[11px] text-[#98a2b3]">Email</dt>
              <dd className="truncate text-sm font-medium">{email}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#98a2b3]">Mobile</dt>
              <dd className="truncate text-sm font-medium">{phone}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#eaecf0] text-sm font-semibold text-[#344054]"
          >
            <Settings size={15} /> Settings
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#e10600] text-sm font-semibold text-white"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
