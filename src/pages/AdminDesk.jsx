import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import Pager, { usePaging } from "@/components/common/Pager";

export default function AdminDesk({ view, onSessionExpired }) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({ title: "", url: "", durationSeconds: "120", category: "Promo", reward: "0", body: "" });
  const [broadcast, setBroadcast] = useState({ title: "", body: "", audience: "all" });
  const [page, setPage] = useState(null);
  const list = usePaging(rows, view === "tickets" || view === "videos" ? 5 : 8, view);

  const load = async () => {
    setError("");
    if (view === "audit") {
      const data = await apiFetch("/api/admin/audit");
      setRows(data.audits || []);
    } else if (view === "tickets") {
      const data = await apiFetch("/api/admin/tickets");
      setRows(data.tickets || []);
    } else if (view === "fraud") {
      const data = await apiFetch("/api/admin/fraud");
      setRows(data.flags || []);
    } else if (view === "videos") {
      const data = await apiFetch("/api/admin/videos");
      setRows(data.videos || []);
    } else if (view === "pages") {
      const data = await apiFetch("/api/admin/pages");
      setRows(data.pages || []);
    } else if (view === "messages") {
      const data = await apiFetch("/api/admin/outbox");
      setRows(data.messages || []);
    }
  };

  useEffect(() => {
    setRows([]);
    load().catch((err) => {
      if (err.status === 401) onSessionExpired?.();
      else setError(err.message);
    });
  }, [view]);

  const run = async (path, options, ok) => {
    setError("");
    setNotice("");
    try {
      const data = await apiFetch(path, options);
      setNotice(data.message || ok);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const exportAudit = () => {
    const lines = ["action,target,note,admin,when", ...rows.map((row) => [row.action, row.target, row.note, row.admin, row.at].map(csv).join(","))];
    download("audit-log.csv", lines.join("\n"));
  };

  return (
    <section className="space-y-3">
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {notice ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}
      {view === "audit" ? (
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Audit log</p>
            <button type="button" className="text-xs font-semibold text-[#e10600]" onClick={exportAudit}>Export CSV</button>
          </div>
          <div className="space-y-2">
            {list.items.map((row) => (
              <div key={row.id} className="rounded-xl bg-[#f8fafc] px-3 py-2 text-sm">
                <p className="font-semibold">{row.action} · {row.target}</p>
                <p className="text-xs text-[#667085]">{row.note} · {row.admin} · {when(row.at)}</p>
              </div>
            ))}
            {rows.length === 0 ? <p className="text-sm text-[#98a2b3]">No audit rows yet.</p> : null}
          </div>
          <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
        </article>
      ) : null}
      {view === "tickets" ? (
        <div className="space-y-3">
          {list.items.map((ticket) => (
            <article key={ticket.id} className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{ticket.subject}</p>
                  <p className="text-xs text-[#98a2b3]">{ticket.member} · {ticket.referralId} · {ticket.assigneeName || "Unassigned"}</p>
                </div>
                <StatusBadge tone={ticket.status === "Resolved" ? "success" : "pending"}>{ticket.status}</StatusBadge>
              </div>
              <div className="mt-2 space-y-1">
                {(ticket.messages || []).map((item, index) => (
                  <p key={index} className="rounded-lg bg-[#f8fafc] px-2 py-1 text-sm"><span className="font-semibold">{item.from}: </span>{item.body}</p>
                ))}
              </div>
              {ticket.status !== "Resolved" ? (
                <div className="mt-3">
                  <Button type="button" variant="outline" onClick={() => run(`/api/admin/tickets/${ticket.id}/resolve`, { method: "POST" })}>Resolve</Button>
                </div>
              ) : null}
              {ticket.status !== "Resolved" ? (
                <form className="mt-2" onSubmit={(event) => { event.preventDefault(); run(`/api/admin/tickets/${ticket.id}/reply`, { method: "POST", body: JSON.stringify({ body: draft.body }) }); setDraft((prev) => ({ ...prev, body: "" })); }}>
                  <textarea value={draft.body} onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))} className="h-16 w-full rounded-xl border border-[#eaecf0] p-2 text-sm" placeholder="Reply to the member" />
                  <Button className="mt-2" type="submit">Send reply</Button>
                </form>
              ) : null}
            </article>
          ))}
          {rows.length === 0 ? <p className="text-sm text-[#98a2b3]">No tickets yet.</p> : null}
          <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
        </div>
      ) : null}
      {view === "fraud" ? (
        <div className="space-y-2">
          {list.items.map((flag) => (
            <article key={flag.id} className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
              <div className="flex items-center justify-between">
                <p className="font-bold">{flag.type}</p>
                <StatusBadge tone={flag.status === "Open" ? "danger" : "inactive"}>{flag.status}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-[#475467]">{flag.note}</p>
              <p className="mt-1 text-xs text-[#98a2b3]">{(flag.accounts || []).join(", ")} · hits {flag.hits} {flag.deviceId ? `· ${flag.deviceId}` : ""}</p>
              {flag.status === "Open" ? <Button className="mt-2" variant="outline" onClick={() => run(`/api/admin/fraud/${flag.id}/close`, { method: "POST" })}>Close flag</Button> : null}
            </article>
          ))}
          {rows.length === 0 ? <p className="text-sm text-[#98a2b3]">No open fraud flags.</p> : null}
          <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
        </div>
      ) : null}
      {view === "videos" ? (
        <div className="space-y-3">
          <form className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]" onSubmit={(event) => { event.preventDefault(); run("/api/admin/videos", { method: "POST", body: JSON.stringify({ url: draft.url }) }); }}>
            <p className="mb-1 font-bold">Add today's task video</p>
            <p className="mb-2 text-xs text-[#98a2b3]">Paste a YouTube, Vimeo, or MP4 link. The member watches the full video. The reward is the daily ROI from their plan.</p>
            <input value={draft.url} onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))} className="mb-3 h-10 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" placeholder="https://www.youtube.com/watch?v=..." required />
            <Button type="submit">Save video</Button>
          </form>
          {list.items.map((video) => (
            <article key={video.id} className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{video.title}</p>
                  <p className="truncate text-xs text-[#98a2b3]">{video.active === false ? "Hidden" : "Published"} · {video.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={video.active !== false} onChange={(event) => { const active = event.target.checked; setRows((list) => list.map((row) => row.id === video.id ? { ...row, active } : row)); run(`/api/admin/videos/${video.id}`, { method: "PUT", body: JSON.stringify({ active }) }); }} />
                    Show
                  </label>
                  <Button variant="outline" onClick={() => run(`/api/admin/videos/${video.id}/use`, { method: "POST" })}>Use today</Button>
                </div>
              </div>
            </article>
          ))}
          <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
        </div>
      ) : null}
      {view === "pages" ? (
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-2">
            {list.items.map((item) => (
              <button key={item.slug} type="button" onClick={() => setPage(item)} className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold ${page?.slug === item.slug ? "border-[#e10600] bg-[#e10600] text-white" : "border-[#eaecf0] bg-white text-[#475467]"}`}>{item.title}</button>
            ))}
            <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
          </div>
          {page ? (
            <form className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]" onSubmit={(event) => { event.preventDefault(); run(`/api/admin/pages/${page.slug}`, { method: "PUT", body: JSON.stringify(page) }); }}>
              <input value={page.title} onChange={(event) => setPage((prev) => ({ ...prev, title: event.target.value }))} className="mb-2 h-10 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
              <textarea value={page.body} onChange={(event) => setPage((prev) => ({ ...prev, body: event.target.value }))} className="h-48 w-full rounded-xl border border-[#eaecf0] p-3 text-sm" />
              <Button className="mt-2" type="submit">Save page</Button>
            </form>
          ) : <p className="text-sm text-[#98a2b3]">Select a page.</p>}
        </div>
      ) : null}
      {view === "messages" ? (
        <div className="space-y-2">
          <form className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]" onSubmit={(event) => {
            event.preventDefault();
            run("/api/admin/broadcast", { method: "POST", body: JSON.stringify(broadcast) });
          }}>
            <p className="font-bold">Broadcast</p>
            <p className="mb-2 text-xs text-[#98a2b3]">Members see this in Notifications. Email, SMS and push are queued as a demo.</p>
            <input value={broadcast.title} onChange={(event) => setBroadcast((prev) => ({ ...prev, title: event.target.value }))} className="mb-2 h-10 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" placeholder="Title" required />
            <textarea value={broadcast.body} onChange={(event) => setBroadcast((prev) => ({ ...prev, body: event.target.value }))} className="h-20 w-full rounded-xl border border-[#eaecf0] p-3 text-sm" placeholder="Message" required />
            <label className="mt-2 block text-xs text-[#667085]">
              Audience
              <select value={broadcast.audience} onChange={(event) => setBroadcast((prev) => ({ ...prev, audience: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[#eaecf0] px-3 text-sm">
                <option value="all">All members</option>
                <option value="active">Active subscriptions only</option>
              </select>
            </label>
            <Button className="mt-3" type="submit">Send broadcast</Button>
          </form>
          {list.items.map((row) => (
            <article key={row.id} className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-sm shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
              <p className="font-semibold">{row.channel} · {row.title}</p>
              <p className="text-xs text-[#98a2b3]">{row.to} · {row.status} · {when(row.at)}</p>
            </article>
          ))}
          {rows.length === 0 ? <p className="text-sm text-[#98a2b3]">No queued messages. A ticket reply writes in-app, email, SMS and push rows.</p> : null}
          <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
        </div>
      ) : null}
    </section>
  );
}

function when(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
