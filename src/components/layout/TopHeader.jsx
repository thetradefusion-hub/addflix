import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Search } from "lucide-react";
import { searchPages, user } from "@/data/mockData";
import { useApp } from "@/context/AppContext";

export default function TopHeader() {
  const navigate = useNavigate();
  const { unreadCount, notes, markNotesRead } = useApp();
  const [query, setQuery] = useState("");
  const [openNotes, setOpenNotes] = useState(false);
  const [openLang, setOpenLang] = useState(false);
  const [lang, setLang] = useState("English");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchPages.filter((page) => page.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const close = () => {
      setOpenNotes(false);
      setOpenLang(false);
    };
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, []);

  return (
    <header className="hidden h-[68px] items-center gap-4 bg-[#0c0e13] px-5 lg:flex">
      <div className="relative max-w-xl flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search here..."
          aria-label="Search pages"
          className="h-10 w-full rounded-full border border-white/10 bg-[#1a1d24] pl-10 pr-4 text-sm text-white outline-none placeholder:text-[#98a2b3] focus:border-white/20"
        />
        {query.trim() ? (
          <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-[#eaecf0] bg-white py-1 shadow-xl">
            {results.length ? results.map((page) => (
              <button
                key={page.to}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => {
                  navigate(page.to);
                  setQuery("");
                }}
              >
                {page.label}
              </button>
            )) : <p className="px-4 py-2 text-sm text-[#667085]">No pages found</p>}
          </div>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <button
            className="relative grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10"
            aria-label="Notifications"
            onClick={() => {
              setOpenNotes((v) => !v);
              setOpenLang(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e10600] px-1 text-[10px] font-bold">
                {unreadCount}
              </span>
            ) : null}
          </button>
          {openNotes ? (
            <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-[#eaecf0] bg-white p-3 text-[#101828] shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">Notifications</p>
                <button className="text-xs font-semibold text-[#e10600]" onClick={markNotesRead}>
                  Mark read
                </button>
              </div>
              <div className="max-h-72 space-y-2 overflow-auto">
                {notes.slice(0, 4).map((note) => (
                  <button key={note.id} onClick={() => navigate("/notifications")} className="block w-full rounded-xl bg-[#f8fafc] p-2.5 text-left">
                    <p className="text-sm font-semibold">{note.title}</p>
                    <p className="text-xs text-[#667085]">{note.body}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-white"
            onClick={() => {
              setOpenLang((v) => !v);
              setOpenNotes(false);
            }}
          >
            {lang} <ChevronDown size={14} />
          </button>
          {openLang ? (
            <div className="absolute right-0 top-10 z-30 w-36 rounded-xl border border-[#eaecf0] bg-white py-1 text-sm text-[#101828] shadow-xl">
              {["English", "Hindi"].map((item) => (
                <button
                  key={item}
                  className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() => {
                    setLang(item);
                    setOpenLang(false);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-left text-white hover:bg-white/5">
          <img src="/images/avatar-rahul.png" alt="" className="h-9 w-9 rounded-full object-cover" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{user.name}</span>
            <span className="block text-[11px] text-white/55">ID: {user.id}</span>
          </span>
        </button>
      </div>
    </header>
  );
}
