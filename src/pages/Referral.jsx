import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Download, Gift, Share2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import QrCode from "@/components/common/QrCode";
import StatusBadge from "@/components/common/StatusBadge";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { copyText, money } from "@/lib/utils";
import Pager, { usePaging } from "@/components/common/Pager";
import { formatLedgerDate } from "@/lib/ledger";
import { useApp } from "@/context/AppContext";
import AppIcon from "@/components/common/AppIcon";
import { WhatsAppIcon, whatsappShareUrl } from "@/lib/whatsappShare.jsx";

const shareMarks = {
  Telegram: {
    color: "#26A5E4",
    path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0zm4.962 7.224c.1-.002.321.023.465.14a.5.5 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024q-.159.037-5.061 3.345q-.72.495-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789q.04-.324.893-.663q5.247-2.286 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635",
  },
  Facebook: {
    color: "#1877F2",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978c.401 0 .955.042 1.468.103a9 9 0 0 1 1.141.195v3.325a9 9 0 0 0-.653-.036a27 27 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.7 1.7 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103l-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647",
  },
};

function ShareIcon({ name }) {
  if (name === "More") {
    return (
      <span className="theme-fixed grid h-6 w-6 place-items-center rounded-full bg-white text-[#111827]">
        <Share2 size={13} />
      </span>
    );
  }
  if (name === "WhatsApp") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ backgroundColor: "#25D366" }}>
        <WhatsAppIcon size={14} />
      </span>
    );
  }
  const mark = shareMarks[name];
  if (name === "Telegram") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path fill={mark.color} d={mark.path} />
      </svg>
    );
  }
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ backgroundColor: mark.color }}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path fill="currentColor" d={mark.path} />
      </svg>
    </span>
  );
}

export default function Referral({ view = "link", level: fixedLevel = 1 }) {
  const { toast, sessionUser, referralCredits, network } = useApp();
  const teamMembers = network.members || [];
  const levelRates = network.levels?.length ? network.levels : [1, 2, 3, 4].map((level) => ({ level, label: `Level ${level}`, amount: 0, members: 0, active: 0 }));
  const memberId = sessionUser?.id || "—";
  const referralLink = sessionUser?.referralLink || "";
  const [picked, setPicked] = useState(null);
  const [level, setLevel] = useState(view === "level" ? fixedLevel : 0);
  const [openLevel, setOpenLevel] = useState(view === "level" ? fixedLevel : 1);
  useEffect(() => {
    if (view === "level") {
      setLevel(fixedLevel);
      setOpenLevel(fixedLevel);
    }
  }, [view, fixedLevel]);
  const rows = teamMembers.filter((member) => (level ? member.level === level : true));
  const livePayouts = (referralCredits || [])
    .filter((row) => (view === "level" ? row.level === fixedLevel : true))
    .map((row) => ({
      id: row.id,
      date: formatLedgerDate(row.date),
      user: row.user,
      level: row.level,
      amount: row.amount,
      commission: row.commission,
      status: row.status,
      tx: row.tx,
    }));
  const payouts = livePayouts;
  const teamPage = usePaging(rows, 8, level);
  const payoutPage = usePaging(payouts, 8, `${view}:${fixedLevel}`);
  const current = levelRates.find((item) => item.level === fixedLevel) || levelRates[0];
  const title = view === "level" ? `Level ${fixedLevel}` : "My Referral Link";
  const referralTotal = (referralCredits || []).reduce((sum, row) => sum + Number(row.commission || 0), 0);
  const subtitle = view === "level"
    ? `${current.members} members · $${money(current.amount)} per $10 subscription`
    : "Share your link and earn on every $10 USDT activation.";

  const share = (name) => {
    const invite = "Join ADD FLIX with my link and get free signup bonus";
    const urls = {
      WhatsApp: whatsappShareUrl(referralLink),
      Telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(invite)}`,
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    };
    if (!referralLink) {
      toast("Referral link is not ready yet.", "warning");
      return;
    }
    if (!urls[name]) {
      copyText(referralLink);
      toast("Referral link copied.");
      return;
    }
    window.open(urls[name], "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title={title}
        subtitle={subtitle}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Referral", to: "/referral/link" }, { label: title }]}
      />

      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Total Referrals", String(network.direct || 0), "Direct members", "UserPlus"],
          ["Active Team", String(network.active || 0), `Of ${network.total || 0} members`, "Users"],
          ["Referral Income", `$${money(referralTotal)}`, "Lifetime", "HandCoins"],
          ["4 Level Commission", `$${money(network.commissionPerTen || 0)}`, "Per $10 subscription", "Gift"],
        ].map(([label, value, hint, icon]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[#e10600]"><AppIcon name={icon} size={16} /></span>
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="text-xl font-black">{value}</p>
            <p className="text-[11px] text-[#98a2b3]">{hint}</p>
          </article>
        ))}
      </section>

      {view === "level" ? (
        <section className="mb-4 rounded-2xl bg-gradient-to-r from-[#3a0a12] to-[#e10600] p-5 text-white">
          <p className="text-sm text-white/70">Level {fixedLevel} commission</p>
          <p className="text-4xl font-black">${money(current.amount)}</p>
          <p className="mt-1 text-sm text-white/80">{current.members} members · {current.active} active · ${money(current.amount)} each</p>
        </section>
      ) : null}

      {view !== "level" ? (
      <section className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr]">
        <article className="rounded-2xl bg-gradient-to-r from-[#3a0a12] to-[#e10600] p-4 text-white">
          <p className="text-xl font-black">Invite & Earn</p>
          <p className="text-sm text-white/80">Share your referral link and earn 4 level income on every $10 USDT subscription.</p>
          <p className="mt-3 text-xs">Your Referral Link</p>
          <div className="mt-1 flex items-center gap-2 rounded-xl bg-white/10 p-2">
            <p className="flex-1 truncate text-sm">{referralLink}</p>
            <button aria-label="Copy referral link" onClick={() => { copyText(referralLink); toast("Referral link copied."); }} className="theme-fixed rounded-lg bg-white p-2 text-[#111]"><Copy size={14} /></button>
          </div>
          <Button className="theme-fixed mt-3 bg-white text-[#e10600] hover:bg-white" onClick={() => { copyText(referralLink); toast("Referral link copied."); }}>Copy Link</Button>
          <div className="mt-3 flex flex-wrap gap-2">
            {["WhatsApp", "Telegram", "Facebook", "More"].map((name) => (
              <button key={name} onClick={() => share(name)} className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold">
                <ShareIcon name={name} />
                {name}
              </button>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-center">
          <p className="font-bold">Your Referral QR Code</p>
          <div className="relative mx-auto mt-3 w-36"><QrCode value={referralLink} /></div>
          <Button variant="ghost" className="mt-3" onClick={() => { if (referralLink) window.open(`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(referralLink)}`, "_blank", "noopener,noreferrer"); }}><Download size={14} /> Download QR</Button>
        </article>
      </section>
      ) : null}

      {view !== "level" ? (
      <section className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="mb-3 font-bold">Level Commission (Per $10 Subscription)</p>
          <div className="space-y-2">
            {levelRates.map((levelItem) => (
              <div key={levelItem.level} className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e10600] text-xs font-bold text-white">{levelItem.level}</span>
                  <div>
                    <p className="text-sm font-semibold">{levelItem.label}</p>
                    {levelItem.rate ? <p className="text-[11px] text-[#98a2b3]">{levelItem.rate}</p> : null}
                  </div>
                </div>
                <p className="font-bold">${money(levelItem.amount)}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="font-bold">Team Tree (4 Levels)</p>
          <div className="mt-4 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-xs font-bold">You<br />{` `}</span>
            <p className="text-xs text-[#667085]">{memberId}</p>
            <div className="mx-auto mt-2 h-4 w-px bg-slate-200" />
            <div className="grid grid-cols-4 gap-2">
              {levelRates.map((item) => (
                <button key={item.level} onClick={() => { setOpenLevel(item.level); }} className={`rounded-xl border p-2 text-xs ${openLevel === item.level ? "border-[#e10600] bg-red-50" : "border-[#eaecf0]"}`}>
                  <p className="font-bold">L{item.level}</p>
                  <p>{item.members}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {teamMembers.filter((m) => m.level === openLevel).length === 0 ? <p className="col-span-4 text-xs text-[#98a2b3]">No members on this level.</p> : null}
              {teamMembers.filter((m) => m.level === openLevel).slice(0, 4).map((member) => (
                <div key={member.id} className="rounded-xl bg-[#f8fafc] p-2 text-xs">
                  <p className="font-semibold">{member.name.split(" ")[0]}</p>
                  <p className="text-[#98a2b3]">{member.id}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
      ) : null}

      <section className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {levelRates.map((item) => (
          <Link key={item.level} to={`/referral/level/${item.level}`} className="rounded-2xl border border-[#eaecf0] bg-white p-3">
            <p className="text-xs text-[#667085]">Level {item.level}</p>
            <p className="text-lg font-black">{item.members}</p>
            <p className="text-[11px] text-emerald-600">Active: {item.active}</p>
          </Link>
        ))}
      </section>

      {view !== "link" ? (
      <section className="mt-3 rounded-2xl border border-[#eaecf0] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold">Team Members</p>
          <div className="flex gap-1 overflow-auto">
            {["All", 1, 2, 3, 4].map((item) => (
              <button key={item} onClick={() => setLevel(item === "All" ? 0 : item)} className={`rounded-full px-3 py-1 text-xs font-semibold ${ (item === "All" && level === 0) || item === level ? "bg-[#111] text-white" : "bg-slate-100"}`}>{item === "All" ? "All" : `L${item}`}</button>
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]"><tr>{["#", "User ID", "Name", "Level", "Join Date", "Status"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-sm text-[#98a2b3]">No members on this level yet.</td></tr> : null}
              {teamPage.items.map((row, index) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  <td className="py-3">{teamPage.start + index + 1}</td>
                  <td>{row.id}</td>
                  <td><button className="text-left font-semibold text-[#e10600]" onClick={() => setPicked(row)}>{row.name}</button></td>
                  <td>Level {row.level}</td>
                  <td>{row.joined}</td>
                  <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 lg:hidden">
          {teamPage.items.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
              <div className="flex justify-between"><p className="font-semibold">{row.name}</p><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#667085]">{row.id} · Level {row.level}</p>
              <p className="text-xs text-[#98a2b3]">{row.joined}</p>
            </article>
          ))}
        </div>
        <Pager page={teamPage.page} pages={teamPage.pages} total={teamPage.total} size={teamPage.size} onChange={teamPage.setPage} />
      </section>
      ) : null}

      <section className="mt-3 rounded-2xl border border-[#eaecf0] bg-white p-4">
        <p className="mb-3 flex items-center gap-2 font-bold"><Gift size={16} /> {view === "level" ? `Level ${fixedLevel} income` : "Referral Income History"}</p>
        <div className="hidden lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]"><tr>{["Date & Time", "From User", "Level", "Subscription", "Commission", "Status", "TX ID"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {payoutPage.items.map((row) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  <td className="py-3">{row.date}</td>
                  <td>{row.user}</td>
                  <td>Level {row.level}</td>
                  <td>${money(row.amount)} USDT</td>
                  <td className="font-semibold text-emerald-600">${money(row.commission)}</td>
                  <td><StatusBadge tone="credited">{row.status}</StatusBadge></td>
                  <td>{row.tx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 lg:hidden">
          {payoutPage.items.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between"><span>Level {row.level} · {row.user}</span><span className="font-bold text-emerald-600">+${money(row.commission)}</span></div>
              <p className="text-xs text-[#98a2b3]">{row.date} · {row.tx}</p>
            </article>
          ))}
        </div>
        <Pager page={payoutPage.page} pages={payoutPage.pages} total={payoutPage.total} size={payoutPage.size} onChange={payoutPage.setPage} />
        <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#e10600]" onClick={() => share("Share")}><Share2 size={12} /> Share link again</button>
      </section>

      <Modal open={Boolean(picked)} title={picked?.name || "Member"} onClose={() => setPicked(null)}>
        {picked ? (
          <ul className="space-y-2">
            {[["User ID", picked.id], ["Level", `Level ${picked.level}`], ["Sponsor", picked.sponsor], ["Joined", picked.joined], ["Subscription", picked.status], ["Active plan", picked.plan], ["Investment", `$${money(picked.investment)}`], ["Tasks this month", String(picked.tasks)]].map(([label, value]) => (
              <li key={label} className="flex justify-between gap-3 text-sm"><span className="text-[#667085]">{label}</span><span className="font-semibold text-[#101828]">{value}</span></li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </div>
  );
}
