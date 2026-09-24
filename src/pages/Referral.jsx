import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Copy, Download, Gift, Share2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import QrCode from "@/components/common/QrCode";
import StatusBadge from "@/components/common/StatusBadge";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { levelRates, referralHistory, referralLink, teamMembers, user } from "@/data/mockData";
import { copyText, money } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import AppIcon from "@/components/common/AppIcon";

function TeamNode({ member, members, onPick, depth = 0 }) {
  const kids = members.filter((row) => row.parent === member.id);
  const [open, setOpen] = useState(depth < 1);
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#f8fafc]" style={{ paddingLeft: depth * 16 + 8 }}>
        {kids.length ? (
          <button type="button" aria-label={open ? "Collapse" : "Expand"} onClick={() => setOpen((v) => !v)} className="grid h-6 w-6 place-items-center rounded-md bg-[#f2f4f7]">
            <ChevronDown size={14} className={open ? "rotate-180" : ""} />
          </button>
        ) : <span className="w-6" />}
        <button type="button" onClick={() => onPick(member)} className="min-w-0 flex-1 text-left">
          <span className="font-semibold">{member.name}</span>
          <span className="ml-2 text-[11px] text-[#98a2b3]">L{member.level} · {member.id}</span>
        </button>
        <StatusBadge tone={member.status}>{member.status}</StatusBadge>
      </div>
      {open ? kids.map((child) => <TeamNode key={child.id} member={child} members={members} onPick={onPick} depth={depth + 1} />) : null}
    </div>
  );
}

export default function Referral({ view = "link", level: fixedLevel = 1 }) {
  const { toast } = useApp();
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
  const payouts = referralHistory.filter((row) => (view === "level" ? row.level === fixedLevel : true));
  const current = levelRates.find((item) => item.level === fixedLevel) || levelRates[0];
  const title = view === "team" ? "My Team" : view === "level" ? `Level ${fixedLevel}` : "My Referral Link";
  const subtitle = view === "team"
    ? "126 members across 4 levels. 94 are active."
    : view === "level"
      ? `${current.members} members · ${current.rate || "commission"} · $${money(current.amount)} per $10 subscription`
      : "Share your link and earn on every $10 USDT activation.";

  const share = (name) => toast(`${name} share opened in this demo.`, "info");

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title={title}
        subtitle={subtitle}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: view === "team" ? "My Team" : "Referral", to: "/referral/link" }, { label: title }]}
      />

      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Total Referrals", "24", "Direct members", "UserPlus"],
          ["Active Team", "94", "Of 126 members", "Users"],
          ["Referral Income", "$180.00", "Lifetime", "HandCoins"],
          ["4 Level Commission", "$5.00", "Per $10 subscription", "Gift"],
        ].map(([label, value, hint, icon]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[#e10600]"><AppIcon name={icon} size={16} /></span>
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="text-xl font-black">{value}</p>
            <p className="text-[11px] text-[#98a2b3]">{hint}</p>
          </article>
        ))}
      </section>

      {view === "team" ? (
        <section className="mb-4 rounded-2xl border border-[#eaecf0] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-bold">Sponsor tree</p>
              <p className="text-xs text-[#98a2b3]">Expand a member. Click a name for profile details.</p>
            </div>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-2 py-2">
            <p className="px-2 py-1.5 text-sm font-black">You · {user.id}</p>
            {teamMembers.filter((row) => row.level === 1).map((member) => (
              <TeamNode key={member.id} member={member} members={teamMembers} onPick={setPicked} depth={0} />
            ))}
          </div>
        </section>
      ) : null}

      {view === "level" ? (
        <section className="mb-4 rounded-2xl bg-gradient-to-r from-[#3a0a12] to-[#e10600] p-5 text-white">
          <p className="text-sm text-white/70">Level {fixedLevel} commission</p>
          <p className="text-4xl font-black">${money(current.amount)}</p>
          <p className="mt-1 text-sm text-white/80">{current.members} members · {current.active} active · {current.rate || "fixed USDT"}</p>
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
            <button aria-label="Copy referral link" onClick={() => { copyText(referralLink); toast("Referral link copied."); }} className="rounded-lg bg-white p-2 text-[#111]"><Copy size={14} /></button>
          </div>
          <Button className="mt-3 bg-white text-[#e10600] hover:bg-white" onClick={() => { copyText(referralLink); toast("Referral link copied."); }}>Copy Link</Button>
          <div className="mt-3 flex flex-wrap gap-2">
            {["WhatsApp", "Telegram", "Facebook", "More"].map((name) => (
              <button key={name} onClick={() => share(name)} className="rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold">{name}</button>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-center">
          <p className="font-bold">Your Referral QR Code</p>
          <div className="relative mx-auto mt-3 w-36"><QrCode /></div>
          <Button variant="ghost" className="mt-3" onClick={() => toast("QR download is simulated in this demo.", "info")}><Download size={14} /> Download QR</Button>
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
            <p className="text-xs text-[#667085]">ADF12568</p>
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
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  <td className="py-3">{index + 1}</td>
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
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
              <div className="flex justify-between"><p className="font-semibold">{row.name}</p><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
              <p className="text-xs text-[#667085]">{row.id} · Level {row.level}</p>
              <p className="text-xs text-[#98a2b3]">{row.joined}</p>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      <section className="mt-3 rounded-2xl border border-[#eaecf0] bg-white p-4">
        <p className="mb-3 flex items-center gap-2 font-bold"><Gift size={16} /> {view === "level" ? `Level ${fixedLevel} income` : "Referral Income History"}</p>
        <div className="hidden lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]"><tr>{["Date & Time", "From User", "Level", "Subscription", "Commission", "Status", "TX ID"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {payouts.map((row) => (
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
          {payouts.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between"><span>Level {row.level} · {row.user}</span><span className="font-bold text-emerald-600">+${money(row.commission)}</span></div>
              <p className="text-xs text-[#98a2b3]">{row.date} · {row.tx}</p>
            </article>
          ))}
        </div>
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
