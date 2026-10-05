import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import Modal from "@/components/common/Modal";
import Pager, { usePaging } from "@/components/common/Pager";
import EmptyState from "@/components/common/EmptyState";
import AppIcon from "@/components/common/AppIcon";
import { money } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

const sameId = (a, b) => String(a || "").toUpperCase() === String(b || "").toUpperCase();

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function branchMatches(member, members, query) {
  if (`${member.name} ${member.id}`.toLowerCase().includes(query)) return true;
  return members.some((row) => sameId(row.parent, member.id) && branchMatches(row, members, query));
}

function GeneNode({ member, members, onPick, depth, query, focusLevel }) {
  const kids = members.filter((row) => sameId(row.parent, member.id));
  const visibleKids = query ? kids.filter((row) => branchMatches(row, members, query)) : kids;
  const [open, setOpen] = useState(depth < 1);
  useEffect(() => {
    if (query) setOpen(true);
  }, [query]);
  const hot = focusLevel && member.level === focusLevel;

  return (
    <li>
      <div className={`relative w-[8.75rem] rounded-2xl border bg-white px-2 py-2.5 text-center ${hot ? "border-[#e10600]" : "border-[#eaecf0]"}`}>
        <button type="button" onClick={() => onPick(member)} className="w-full text-center">
          <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-red-50 text-xs font-bold text-[#e10600]">{initials(member.name)}</span>
          <span className="mt-1 block truncate text-xs font-semibold text-[#101828]">{member.name}</span>
          <span className="block truncate text-[10px] text-[#667085]">{member.id}</span>
          <span className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#475467]">L{member.level}</span>
            <StatusBadge tone={member.status}>{member.status}</StatusBadge>
          </span>
        </button>
        {kids.length ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? `Hide ${member.name}'s team` : `Show ${member.name}'s team`}
            onClick={() => setOpen((value) => !value)}
            className="absolute -bottom-2.5 left-1/2 z-10 grid h-5 min-w-5 -translate-x-1/2 place-items-center rounded-full border border-[#eaecf0] bg-white px-1 text-[10px] font-bold text-[#344054]"
          >
            {open ? "–" : kids.length}
          </button>
        ) : null}
      </div>
      {open && visibleKids.length ? (
        <ul>
          {visibleKids.map((child) => (
            <GeneNode key={child.id} member={child} members={members} onPick={onPick} depth={depth + 1} query={query} focusLevel={focusLevel} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function Team() {
  const { sessionUser, network } = useApp();
  const members = network.members || [];
  const memberId = sessionUser?.id || "—";
  const [picked, setPicked] = useState(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState(0);
  const q = query.trim().toLowerCase();
  const roots = useMemo(
    () => members.filter((row) => row.level === 1 && (!q || branchMatches(row, members, q))),
    [members, q],
  );
  const directory = useMemo(
    () => members.filter((row) => {
      const levelOk = !level || row.level === level;
      const searchOk = !q || `${row.name} ${row.id} ${row.sponsor || ""}`.toLowerCase().includes(q);
      return levelOk && searchOk;
    }),
    [members, level, q],
  );
  const page = usePaging(directory, 8, `${level}:${q}`);
  const inactive = members.filter((row) => row.status !== "Active").length;
  const scrollerRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const root = rootRef.current;
    if (!scroller || !root) return;
    const scrollerBox = scroller.getBoundingClientRect();
    const rootBox = root.getBoundingClientRect();
    const hidden = rootBox.left < scrollerBox.left + 8 || rootBox.right > scrollerBox.right - 8;
    if (!hidden) return;
    const delta = rootBox.left - scrollerBox.left - (scrollerBox.width - rootBox.width) / 2;
    scroller.scrollLeft += delta;
  }, [members.length, q]);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="My Team" crumbs={[{ label: "Home", to: "/dashboard" }, { label: "My Team" }]} />

      <section className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {[
          ["Total Team", String(network.total || 0), "Users"],
          ["Active", String(network.active || 0), "BadgeCheck"],
          ["Direct", String(network.direct || 0), "UserPlus"],
          ["Inactive", String(inactive), "UserRound"],
        ].map(([label, value, icon]) => (
          <article key={label} className="flex items-center gap-2 rounded-xl border border-[#eaecf0] bg-white px-2.5 py-2 lg:block lg:rounded-2xl lg:p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-50 text-[#e10600] lg:mb-2 lg:h-9 lg:w-9 lg:rounded-full"><AppIcon name={icon} size={14} /></span>
            <span className="min-w-0">
              <span className="block text-[11px] leading-tight text-[#667085] lg:text-xs">{label}</span>
              <span className="mt-1 block text-sm font-black leading-none lg:text-xl">{value}</span>
            </span>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#eaecf0] bg-white p-3 lg:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-[#101828]">Genealogy</p>
          <label className="relative block sm:w-64">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or ID"
              aria-label="Search team"
              className="h-10 w-full rounded-full border border-[#eaecf0] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#e10600]"
            />
          </label>
        </div>
        <div ref={scrollerRef} className="overflow-x-auto pb-4">
          <div className="gene-tree mx-auto w-max min-w-full px-2 py-2">
            <ul>
              <li>
                <div ref={rootRef} className="w-[8.75rem] rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 px-2 py-3 text-center text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/75">You</p>
                  <p className="mt-1 truncate text-sm font-black">{sessionUser?.name || "You"}</p>
                  <p className="truncate text-[10px] text-white/80">{memberId}</p>
                </div>
                {roots.length ? (
                  <ul>
                    {roots.map((member) => (
                      <GeneNode key={member.id} member={member} members={members} onPick={setPicked} depth={0} query={q} focusLevel={level} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-center text-sm text-[#667085]">{q ? "No member matches that search." : "No downline yet."}</p>
                )}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-[#eaecf0] bg-white p-3 lg:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-[#101828]">Team Members</p>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {["All", 1, 2, 3, 4].map((item) => (
              <button key={item} type="button" onClick={() => setLevel(item === "All" ? 0 : item)} className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${(item === "All" && level === 0) || item === level ? "bg-[#e10600] text-white" : "bg-slate-100 text-[#475467]"}`}>{item === "All" ? "All" : `L${item}`}</button>
            ))}
          </div>
        </div>
        {page.total === 0 ? <EmptyState title="No members found" body={q || level ? "Change the level or search text." : "Share your referral link to grow this team."} /> : (
          <>
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[#667085]"><tr>{["#", "User ID", "Name", "Level", "Sponsor", "Joined", "Status"].map((heading) => <th key={heading} className="pb-2 font-medium">{heading}</th>)}</tr></thead>
                <tbody>
                  {page.items.map((row, index) => (
                    <tr key={row.id} className="border-t border-[#f2f4f7]">
                      <td className="py-3">{page.start + index + 1}</td>
                      <td>{row.id}</td>
                      <td><button type="button" className="text-left font-semibold text-[#e10600]" onClick={() => setPicked(row)}>{row.name}</button></td>
                      <td>Level {row.level}</td>
                      <td>{row.sponsor || "—"}</td>
                      <td>{row.joined}</td>
                      <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#eaecf0] lg:hidden">
              {page.items.map((row) => (
                <button key={row.id} type="button" onClick={() => setPicked(row)} className="flex w-full items-center gap-3 border-b border-[#f2f4f7] px-3 py-3 text-left last:border-b-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-xs font-bold text-[#e10600]">{initials(row.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[#101828]">{row.name}</span>
                      <StatusBadge tone={row.status}>{row.status}</StatusBadge>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[#667085]">{row.id} · Level {row.level} · {row.sponsor || "—"}</span>
                    <span className="mt-0.5 block text-[10px] text-[#98a2b3]">{row.joined}</span>
                  </span>
                </button>
              ))}
            </div>
            <Pager page={page.page} pages={page.pages} total={page.total} size={page.size} onChange={page.setPage} />
          </>
        )}
      </section>

      <Modal open={Boolean(picked)} title={picked?.name || "Member"} onClose={() => setPicked(null)}>
        {picked ? (
          <ul className="space-y-2">
            {[["User ID", picked.id], ["Level", `Level ${picked.level}`], ["Sponsor", picked.sponsor || "—"], ["Joined", picked.joined], ["Subscription", picked.status], ["Active plan", picked.plan || "—"], ["Investment", `$${money(picked.investment || 0)}`]].map(([label, value]) => (
              <li key={label} className="flex justify-between gap-3 text-sm"><span className="text-[#667085]">{label}</span><span className="font-semibold text-[#101828]">{value}</span></li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </div>
  );
}
