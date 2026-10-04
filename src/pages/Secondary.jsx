import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import AppIcon from "@/components/common/AppIcon";
import { Button } from "@/components/ui/button";
import { reports } from "@/data/mockData";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { copyText, money, shortHash } from "@/lib/utils";
import Pager, { usePaging } from "@/components/common/Pager";

export function NotificationsPage() {
  const { notes, markNotesRead } = useApp();
  const list = usePaging(notes, 8, notes.length);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications" subtitle="Updates about ROI, tasks, team and wallet." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Notifications" }]} />
      <div className="mb-3 text-right"><Button variant="outline" onClick={markNotesRead}>Mark all read</Button></div>
      <div className="space-y-2">
        {list.total === 0 ? <p className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-sm text-[#98a2b3]">No notifications yet. Ticket replies, deposits and withdrawals show up here. Email, SMS and push stay in the admin demo queue.</p> : null}
        {list.items.map((note) => (
          <article key={note.id} className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{note.title}</p>
              {note.unread ? <StatusBadge tone="danger">New</StatusBadge> : <StatusBadge tone="inactive">Read</StatusBadge>}
            </div>
            <p className="mt-1 text-sm text-[#667085]">{note.body}</p>
            <p className="mt-1 text-xs text-[#98a2b3]">{note.time}</p>
          </article>
        ))}
      </div>
      <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
    </div>
  );
}

export function SupportPage() {
  const { toast } = useApp();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [reply, setReply] = useState("");
  const current = tickets.find((row) => row.id === openId);
  const ticketPage = usePaging(tickets, 8, tickets.length);

  const load = async () => {
    const data = await apiFetch("/api/account/tickets");
    setTickets(data.tickets || []);
    setOpenId((currentId) => currentId || data.tickets?.[0]?.id || null);
  };

  useEffect(() => {
    load().catch((error) => toast(error.message));
  }, []);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Support" subtitle="Tickets are saved on your account. Support can assign and reply." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Support" }]} />
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <form
            className="rounded-2xl border border-[#eaecf0] bg-white p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!subject || !message) return;
              try {
                const data = await apiFetch("/api/account/tickets", { method: "POST", body: JSON.stringify({ subject, message }) });
                toast(data.message);
                setSubject("");
                setMessage("");
                await load();
                setOpenId(data.ticket?.id || null);
              } catch (error) {
                toast(error.message);
              }
            }}
          >
            <p className="mb-2 font-bold">New ticket</p>
            <label className="text-xs text-[#667085]">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-3 mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" required />
            <label className="text-xs text-[#667085]">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 h-24 w-full rounded-xl border border-[#eaecf0] p-3 text-sm" required />
            <Button className="mt-3" type="submit">Send Message</Button>
          </form>
          <div className="space-y-2">
            {ticketPage.items.map((ticket) => (
              <button key={ticket.id} type="button" onClick={() => setOpenId(ticket.id)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${openId === ticket.id ? "border-[#e10600] bg-red-50" : "border-[#eaecf0] bg-white"}`}>
                <div>
                  <p className="font-semibold">{ticket.subject}</p>
                  <p className="text-xs text-[#98a2b3]">{ticket.assigneeName ? `Assigned to ${ticket.assigneeName}` : "Waiting for support"}</p>
                </div>
                <StatusBadge tone={ticket.status === "Resolved" ? "success" : "pending"}>{ticket.status}</StatusBadge>
              </button>
            ))}
          </div>
          <Pager page={ticketPage.page} pages={ticketPage.pages} total={ticketPage.total} size={ticketPage.size} onChange={ticketPage.setPage} />
        </div>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          {current ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{current.subject}</p>
                  <p className="text-xs text-[#98a2b3]">{current.id}</p>
                </div>
                <StatusBadge tone={current.status === "Resolved" ? "success" : "pending"}>{current.status}</StatusBadge>
              </div>
              <div className="max-h-72 space-y-2 overflow-auto">
                {current.messages.map((item, index) => (
                  <div key={index} className={`rounded-xl px-3 py-2 text-sm ${item.from === "You" ? "bg-[#f8fafc]" : "bg-red-50"}`}>
                    <p className="text-[11px] font-semibold text-[#667085]">{item.from}</p>
                    <p className="mt-1 text-[#101828]">{item.body}</p>
                  </div>
                ))}
              </div>
              {current.status !== "Resolved" ? (
                <form
                  className="mt-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!reply.trim()) return;
                    try {
                      const data = await apiFetch(`/api/account/tickets/${current.id}/reply`, { method: "POST", body: JSON.stringify({ body: reply.trim() }) });
                      setReply("");
                      toast(data.message);
                      await load();
                    } catch (error) {
                      toast(error.message);
                    }
                  }}
                >
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" className="h-20 w-full rounded-xl border border-[#eaecf0] p-3 text-sm" />
                  <Button className="mt-2" type="submit">Reply</Button>
                </form>
              ) : <p className="mt-3 text-xs text-[#98a2b3]">This ticket is resolved.</p>}
            </>
          ) : <p className="text-sm text-[#98a2b3]">Select a ticket.</p>}
        </article>
      </div>
    </div>
  );
}

export function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Reports" subtitle="Download-ready summaries of income, team and wallet activity." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Reports" }]} />
      <div className="space-y-2">
        {reports.map((report) => (
          <article key={report.id} className="flex items-center justify-between rounded-2xl border border-[#eaecf0] bg-white p-4">
            <div>
              <p className="font-semibold">{report.name}</p>
              <p className="text-xs text-[#98a2b3]">{report.id} · {report.period}</p>
            </div>
            <StatusBadge tone="info">{report.type}</StatusBadge>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ icon, label, value, onChange, type = "text", inputMode, autoComplete = "off", placeholder }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-semibold text-[#667085]">{label}</span>
      <span className="mt-1.5 flex h-12 items-center gap-2 rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 focus-within:border-[#e10600] focus-within:bg-white">
        <AppIcon name={icon} size={16} className="shrink-0 text-[#98a2b3]" />
        <input value={value} onChange={onChange} type={type} inputMode={inputMode} autoComplete={autoComplete} placeholder={placeholder} className="h-full w-full min-w-0 bg-transparent text-sm text-[#101828] outline-none" />
      </span>
    </label>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { toast, subscriptionActive, balances, sessionUser, walletAddress, saveProfile, resetTransactionPin, savePayoutWallet, loginHistory, investments, network } = useApp();
  const logins = usePaging(loginHistory, 8, loginHistory.length);
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "India" });
  const [alerts, setAlerts] = useState(true);
  const [photo, setPhoto] = useState("/images/avatar-rahul.png");
  const [pinOpen, setPinOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [forgotPin, setForgotPin] = useState(false);
  const [pinForm, setPinForm] = useState({ currentPin: "", password: "", pin: "", confirm: "" });
  const [walletForm, setWalletForm] = useState({ address: "", pin: "" });
  const [savingPin, setSavingPin] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setPin = (key) => (e) => setPinForm((prev) => ({ ...prev, [key]: key === "password" ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 6) }));

  useEffect(() => {
    if (!sessionUser) return;
    setForm({
      name: sessionUser.name,
      email: sessionUser.email,
      phone: sessionUser.phone,
      country: sessionUser.country,
    });
  }, [sessionUser]);

  const activePlans = investments.filter((row) => row.status === "Active");
  const activeAmount = activePlans.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const planHint = activePlans.length === 0 ? "No active plan" : activePlans.length === 1 ? activePlans[0].planName : `${activePlans.length} active plans`;
  const stats = [
    ["Wallet", "Wallet", `$${money(balances.total)}`, "Available USDT"],
    ["Coins", "Investment", `$${money(activeAmount)}`, planHint],
    ["Users", "Team", String(network.total || 0), `${network.active || 0} active`],
    ["HandCoins", "Total ROI", `$${money(balances.roi || 0)}`, "Lifetime earned"],
  ];

  const shortcuts = [
    ["CreditCard", "Subscription", "Active · $10", "/subscription"],
    ["Wallet", "Wallet", `$${money(balances.total)}`, "/wallet"],
    ["UserPlus", "Referral", sessionUser?.id || "—", "/referral"],
    ["Headphones", "Support", "Open a ticket", "/support"],
  ];

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <PageHeader title="Profile & Settings" subtitle="Your ADD FLIX member details, preferences and payout wallet." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Profile" }]} />

      <article className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-[0_10px_28px_rgba(16,24,40,0.04)]">
        <div className="relative h-24 bg-[linear-gradient(115deg,#14060a_0%,#7f1020_48%,#e10600_100%)] sm:h-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_32%)]" />
        </div>
        <div className="relative px-4 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <label className="relative -mt-8 h-[76px] w-[76px] shrink-0 cursor-pointer sm:-mt-10 sm:h-[88px] sm:w-[88px]">
                <img src={photo} alt="" className="h-full w-full rounded-2xl border-4 border-white object-cover shadow-sm" />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhoto(URL.createObjectURL(file));
                    toast("Profile photo updated on this device.");
                  }}
                />
              </label>
              <div className="min-w-0 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-[#101828] sm:text-2xl">{form.name || sessionUser?.name}</h2>
                  <StatusBadge tone={subscriptionActive ? "active" : "locked"}>{subscriptionActive ? "Active Member" : "Not Active"}</StatusBadge>
                </div>
                <p className="mt-0.5 truncate text-sm text-[#667085]">ID {sessionUser?.id || "—"} · {form.country} · Joined {sessionUser?.joined || "—"}</p>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <Button variant="ghost" size="sm" onClick={async () => { await copyText(sessionUser?.id || ""); toast("Member ID copied."); }}>
                <AppIcon name="Copy" size={14} /> Copy ID
              </Button>
              <Button size="sm" onClick={() => navigate("/referral")}>
                <AppIcon name="Share2" size={14} /> Referral
              </Button>
            </div>
          </div>
        </div>
      </article>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {stats.map(([icon, label, value, hint]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-3.5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[#e10600]">
              <AppIcon name={icon} size={16} />
            </span>
            <p className="mt-2 text-[11px] text-[#667085]">{label}</p>
            <p className="text-lg font-black tracking-tight">{value}</p>
            <p className="text-[11px] text-[#98a2b3]">{hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold">Personal details</p>
              <p className="text-xs text-[#98a2b3]">Saved to your account.</p>
            </div>
            <AppIcon name="UserRound" className="text-[#e10600]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field icon="UserRound" label="Full name" value={form.name} onChange={set("name")} />
            <Field icon="Mail" label="Email" value={form.email} onChange={set("email")} />
            <Field icon="Phone" label="Phone" value={form.phone} onChange={set("phone")} />
            <Field icon="Globe" label="Country" value={form.country} onChange={set("country")} />
          </div>
          <Button className="mt-4" onClick={async () => {
            try {
              await saveProfile(form);
            } catch (error) {
              toast(error.message, "warning");
            }
          }}>Save Changes</Button>
        </article>

        <div className="space-y-3">
          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
            <p className="mb-3 font-bold">Preferences</p>
            <button type="button" onClick={() => setAlerts((v) => !v)} className="flex w-full items-center justify-between rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 py-3 text-left">
              <span>
                <span className="block text-sm font-semibold">ROI & task alerts</span>
                <span className="text-xs text-[#98a2b3]">Reminders for daily video and claim</span>
              </span>
              <span className={`relative h-6 w-11 rounded-full transition ${alerts ? "bg-[#e10600]" : "bg-[#d0d5dd]"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${alerts ? "left-5" : "left-0.5"}`} />
              </span>
            </button>
          </article>

          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
            <p className="mb-3 font-bold">Payout & security</p>
            <div className="space-y-2">
              <div className="rounded-xl bg-[#f8fafc] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-[#667085]">Withdrawal PIN</p>
                    <p className="font-semibold tracking-[0.3em]">{sessionUser?.pinSet ? "••••••" : "Not set"}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setPinOpen((open) => !open); setWalletOpen(false); }}>Change PIN</Button>
                </div>
                {pinOpen ? (
                  <form className="mt-3 space-y-3" onSubmit={async (event) => {
                    event.preventDefault();
                    if (!/^\d{6}$/.test(pinForm.pin)) {
                      toast("Withdrawal PIN must be exactly 6 digits.", "warning");
                      return;
                    }
                    if (pinForm.pin !== pinForm.confirm) {
                      toast("New PIN and confirm PIN do not match.", "warning");
                      return;
                    }
                    setSavingPin(true);
                    try {
                      await resetTransactionPin({
                        pin: pinForm.pin,
                        confirm: pinForm.confirm,
                        currentPin: forgotPin ? "" : pinForm.currentPin,
                        password: forgotPin ? pinForm.password : "",
                      });
                      setPinForm({ currentPin: "", password: "", pin: "", confirm: "" });
                      setPinOpen(false);
                      setForgotPin(false);
                    } catch (error) {
                      toast(error.message, "warning");
                    } finally {
                      setSavingPin(false);
                    }
                  }}>
                    {forgotPin ? (
                      <Field icon="LockKeyhole" label="Login password" type="password" value={pinForm.password} onChange={setPin("password")} />
                    ) : (
                      <Field icon="LockKeyhole" label="Current PIN" type="password" inputMode="numeric" value={pinForm.currentPin} onChange={setPin("currentPin")} />
                    )}
                    <Field icon="LockKeyhole" label="New PIN" type="password" inputMode="numeric" value={pinForm.pin} onChange={setPin("pin")} />
                    <Field icon="LockKeyhole" label="Confirm new PIN" type="password" inputMode="numeric" value={pinForm.confirm} onChange={setPin("confirm")} />
                    <button type="button" onClick={() => setForgotPin((value) => !value)} className="text-xs font-semibold text-[#e10600]">{forgotPin ? "I know my current PIN" : "Forgot PIN? Use login password"}</button>
                    <Button type="submit" className="w-full" disabled={savingPin}>{savingPin ? "Saving..." : "Update PIN"}</Button>
                  </form>
                ) : null}
              </div>
              <div className="rounded-xl bg-[#f8fafc] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={async () => { await copyText(walletAddress); toast("Wallet address copied."); }} className="min-w-0 flex-1 text-left">
                    <span className="block text-xs text-[#667085]">Payout wallet · BEP-20</span>
                    <span className="block truncate text-sm font-semibold">{shortHash(walletAddress, 8, 6)}</span>
                  </button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setWalletOpen((open) => !open); setPinOpen(false); setWalletForm((prev) => ({ ...prev, address: prev.address || walletAddress || "" })); }}>Change</Button>
                </div>
                {walletOpen ? (
                  <form className="mt-3 space-y-3" onSubmit={async (event) => {
                    event.preventDefault();
                    if (!/^0x[a-fA-F0-9]{40}$/.test(walletForm.address.trim())) {
                      toast("Enter a valid BEP-20 wallet address.", "warning");
                      return;
                    }
                    if (!/^\d{6}$/.test(walletForm.pin)) {
                      toast("Enter your 6 digit withdrawal PIN.", "warning");
                      return;
                    }
                    setSavingWallet(true);
                    try {
                      await savePayoutWallet({ address: walletForm.address.trim(), pin: walletForm.pin });
                      setWalletForm({ address: "", pin: "" });
                      setWalletOpen(false);
                    } catch (error) {
                      toast(error.message, "warning");
                    } finally {
                      setSavingWallet(false);
                    }
                  }}>
                    <Field icon="Wallet" label="New BEP-20 address" value={walletForm.address} onChange={(e) => setWalletForm((prev) => ({ ...prev, address: e.target.value.trim() }))} placeholder="0x and 40 hex characters" />
                    <Field icon="LockKeyhole" label="Withdrawal PIN" type="password" inputMode="numeric" value={walletForm.pin} onChange={(e) => setWalletForm((prev) => ({ ...prev, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                    <Button type="submit" className="w-full" disabled={savingWallet}>{savingWallet ? "Saving..." : "Save payout wallet"}</Button>
                  </form>
                ) : null}
              </div>
              <button type="button" onClick={async () => { await copyText(sessionUser?.referralLink || ""); toast("Referral link copied."); }} className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#f8fafc] px-3 py-3 text-left">
                <span className="min-w-0">
                  <span className="block text-xs text-[#667085]">Referral link</span>
                  <span className="block truncate text-sm font-semibold">{(sessionUser?.referralLink || "").replace("https://", "")}</span>
                </span>
                <AppIcon name="Share2" size={16} className="shrink-0 text-[#e10600]" />
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
        <p className="mb-3 font-bold">Login history</p>
        {loginHistory.length ? (
        <>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]"><tr>{["Device", "IP", "Location", "Time", "Session"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {logins.items.map((row) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  <td className="py-3">{row.device}</td>
                  <td>{row.ip}</td>
                  <td>{row.location}</td>
                  <td>{row.time}</td>
                  <td>{row.current ? <StatusBadge tone="active">This device</StatusBadge> : <StatusBadge tone="inactive">Ended</StatusBadge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 lg:hidden">
          {logins.items.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
              <p className="font-semibold">{row.device}</p>
              <p className="text-xs text-[#667085]">{row.location} · {row.ip}</p>
              <p className="text-xs text-[#98a2b3]">{row.time}</p>
            </article>
          ))}
        </div>
        <Pager page={logins.page} pages={logins.pages} total={logins.total} size={logins.size} onChange={logins.setPage} />
        </>
        ) : <p className="text-sm text-[#98a2b3]">No logins recorded yet.</p>}
      </section>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {shortcuts.map(([icon, label, hint, to]) => (
          <button key={label} onClick={() => navigate(to)} className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 text-left shadow-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#111827] text-white">
              <AppIcon name={icon} size={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{label}</span>
              <span className="block truncate text-[11px] text-[#98a2b3]">{hint}</span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-5xl font-black text-[#e10600]">404</p>
      <p className="mt-2 text-lg font-bold">This page is not on ADD FLIX</p>
      <p className="mt-1 text-sm text-[#667085]">The link may be outdated. Head back to your dashboard.</p>
      <Link to="/dashboard" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#e10600] px-4 text-sm font-bold text-white">Go to Dashboard</Link>
    </div>
  );
}
