import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import QrCode from "@/components/common/QrCode";
import IconBubble, { BalanceTile } from "@/components/common/IconBubble";
import AppIcon from "@/components/common/AppIcon";
import { Button } from "@/components/ui/button";
import { walletAddress } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { useActiveGuard } from "@/components/common/ActiveGate";
import { copyText, money } from "@/lib/utils";

export default function WalletPage({ initialTab = "Overview" }) {
  const navigate = useNavigate();
  const { balances, transactions, toast } = useApp();
  const guard = useActiveGuard();
  const [tab, setTab] = useState(initialTab);
  const [hidden, setHidden] = useState(false);

  useEffect(() => setTab(initialTab), [initialTab]);
  const slices = [
    { name: "ROI Balance", value: balances.roi, color: "#22c55e" },
    { name: "Referral Income", value: balances.referral, color: "#60a5fa" },
    { name: "Bonus Balance", value: balances.bonus, color: "#f59e0b" },
    { name: "Locked Balance", value: balances.locked, color: "#a855f7" },
  ];
  const total = balances.total || 1;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title={tab === "Transactions" ? "Transactions" : "Balance"}
        subtitle={tab === "Transactions" ? "Credits and debits across ROI, referral, deposit and withdrawal." : "Your USDT balances, deposit address and withdrawal limits."}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Wallet", to: "/wallet" }, { label: tab === "Transactions" ? "Transactions" : "Balance" }]}
      />

      <div className="mb-4 flex gap-2">
        {["Overview", "Transactions"].map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === item ? "bg-[#111827] text-white" : "bg-white text-[#475467] shadow-sm"}`}>{item}</button>
        ))}
      </div>

      <section className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <article className="relative min-h-[210px] overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#5b21b6_0%,#7e22ce_42%,#db2777_100%)] p-5 text-white shadow-[0_16px_40px_rgba(91,33,182,0.25)]">
          <img src="/images/wallet-card.png" alt="" className="pointer-events-none absolute -right-10 top-0 h-36 w-36 object-cover [mask-image:radial-gradient(circle_at_55%_48%,black_42%,transparent_72%)] sm:h-52 sm:w-52" />
          <p className="text-sm font-medium text-white/80">Total Balance (USDT)</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-4xl font-black tracking-tight sm:text-5xl">{hidden ? "••••" : `$${money(balances.total)}`}</p>
            <button aria-label="Toggle balance visibility" onClick={() => setHidden((v) => !v)} className="text-white/80">
              {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1 text-sm text-white/75">≈ {hidden ? "••••" : `${money(balances.total)} USDT`}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => navigate("/wallet/deposit")} className="h-10 rounded-xl bg-[#e10600] px-5 text-sm font-bold text-white shadow-sm">Deposit</button>
            <button onClick={() => guard() && navigate("/wallet/withdraw")} className="h-10 rounded-xl border border-white/70 bg-white/10 px-5 text-sm font-bold text-white">Withdraw</button>
            <button onClick={() => navigate("/wallet/transfer")} className="h-10 rounded-xl bg-[#4f46e5] px-5 text-sm font-bold text-white">Transfer</button>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <BalanceTile icon={<AppIcon name="HandCoins" size={20} />} iconClass="bg-emerald-50 text-emerald-500" label="ROI Balance" amount={`$${money(balances.roi)}`} hint={`${money(balances.roi)} USDT`} />
          <BalanceTile icon={<AppIcon name="Users" size={20} />} iconClass="bg-sky-50 text-sky-500" label="Referral Balance" amount={`$${money(balances.referral)}`} hint={`${money(balances.referral)} USDT`} />
          <BalanceTile icon={<AppIcon name="Gift" size={20} />} iconClass="bg-orange-50 text-orange-500" label="Bonus Balance" amount={`$${money(balances.bonus)}`} hint={`${money(balances.bonus)} USDT`} />
          <BalanceTile icon={<AppIcon name="LockKeyhole" size={20} />} iconClass="bg-violet-50 text-violet-500" label="Locked Balance" amount={`$${money(balances.locked)}`} hint={`${money(balances.locked)} USDT`} />
        </div>
      </section>

      {tab === "Overview" ? (
        <>
          <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Deposit", "Add USDT to your wallet", "ArrowDownToLine", "bg-emerald-50 text-emerald-500", "/wallet/deposit"],
              ["Withdraw", "Withdraw to external wallet", "ArrowUpFromLine", "bg-rose-50 text-rose-500", "/wallet/withdraw"],
              ["Transfer", "Transfer to other users", "ArrowLeftRight", "bg-sky-50 text-sky-500", "/wallet"],
              ["Wallet Address", "View your wallet address", "QrCode", "bg-violet-50 text-violet-500", "/wallet/deposit"],
            ].map(([label, body, icon, color, to]) => (
              <button key={label} onClick={() => navigate(to)} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 text-left shadow-sm sm:p-4">
                <IconBubble className={color}><AppIcon name={icon} /></IconBubble>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#101828]">{label}</span>
                  <span className="block text-[11px] leading-4 text-[#98a2b3]">{body}</span>
                </span>
              </button>
            ))}
          </section>

          <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
            <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
              <p className="font-bold">Wallet Overview</p>
              <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={slices} dataKey="value" innerRadius={54} outerRadius={74} paddingAngle={3} stroke="none">
                        {slices.map((slice) => <Cell key={slice.name} fill={slice.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-lg font-black text-[#101828]">${money(balances.total)}</p>
                      <p className="text-[11px] text-[#98a2b3]">Total Balance</p>
                    </div>
                  </div>
                </div>
                <ul className="w-full space-y-2 text-xs">
                  {slices.map((slice) => (
                    <li key={slice.name} className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-[#475467]">
                        <i className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                        {slice.name}
                      </span>
                      <span className="font-semibold text-[#101828]">${money(slice.value)} ({Math.round((slice.value / total) * 100)}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
            <TransactionList rows={transactions} toast={toast} />
          </section>

          <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
              <p className="font-bold">Your USDT Wallet Address (BEP-20)</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#f8fafc] p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-black text-amber-600">B</span>
                  <p className="min-w-0 break-all text-sm text-[#344054]">{walletAddress}</p>
                </div>
                <div className="relative mx-auto w-24 shrink-0 sm:mx-0"><QrCode /></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => { copyText(walletAddress); toast("Wallet address copied."); }}><Copy size={14} /> Copy Address</Button>
                <p className="max-w-md text-xs leading-5 text-[#667085]">Send only USDT using BEP-20 (BSC) network. Do not send from other network (ERC20, TRC20, etc.).</p>
              </div>
            </article>
            <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-sm shadow-sm">
              <p className="font-bold">Withdrawal Information</p>
              <dl className="mt-3 space-y-2 text-[#475467]">
                {[
                  ["Minimum Withdrawal", "$10 USDT"],
                  ["Withdrawal Fee", "10%"],
                  ["Processing Time", "1 – 24 Hours"],
                  ["Network", "BEP-20 (BSC)"],
                  ["Withdrawable", `$${money(Math.max(0, balances.total - balances.locked))}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 border-b border-[#f2f4f7] py-1.5">
                    <dt>{label}</dt>
                    <dd className="font-semibold text-[#101828]">{value}</dd>
                  </div>
                ))}
              </dl>
              <button onClick={() => guard() && navigate("/wallet/withdraw")} className="mt-4 h-11 w-full rounded-xl border border-[#e10600] text-sm font-bold text-[#e10600] hover:bg-red-50">Withdraw Now →</button>
            </article>
          </section>
        </>
      ) : (
        <div className="mt-3"><TransactionList rows={transactions} toast={toast} /></div>
      )}
    </div>
  );
}

function txIcon(type) {
  if (type.includes("Referral")) return { name: "Users", color: "bg-sky-50 text-sky-500" };
  if (type.includes("Withdraw")) return { name: "ArrowUpFromLine", color: "bg-rose-50 text-rose-500" };
  if (type.includes("Deposit")) return { name: "ArrowDownToLine", color: "bg-emerald-50 text-emerald-500" };
  if (type.includes("Bonus")) return { name: "Gift", color: "bg-orange-50 text-orange-500" };
  if (type.includes("Transfer")) return { name: "ArrowLeftRight", color: "bg-violet-50 text-violet-500" };
  return { name: "HandCoins", color: "bg-emerald-50 text-emerald-500" };
}

function TransactionList({ rows, toast }) {
  return (
    <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-bold">Recent Transactions</p>
        <button className="text-xs font-semibold text-[#e10600]" onClick={() => toast("Showing the latest wallet ledger.", "info")}>View All</button>
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-[#667085]">
            <tr>{["#", "Date & Time", "Type", "Amount (USDT)", "Status", "Details"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-t border-[#f2f4f7]">
                <td className="py-3">{index + 1}</td>
                <td className="whitespace-nowrap">{row.date}</td>
                <td>{row.type}</td>
                <td className={row.amount > 0 ? "font-semibold text-emerald-600" : "font-semibold text-[#e10600]"}>{row.amount > 0 ? "+" : ""}{money(row.amount)}</td>
                <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
                <td><button className="rounded-lg border border-[#fda4a4] px-2.5 py-1 text-xs font-semibold text-[#e10600]" onClick={() => toast(`${row.type} · ${row.date}`)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 lg:hidden">
        {rows.map((row) => {
          const meta = txIcon(row.type);
          return (
            <article key={row.id} className="flex items-center gap-3 rounded-xl border border-[#f2f4f7] bg-white p-3">
              <IconBubble className={meta.color} size="sm"><AppIcon name={meta.name} size={16} /></IconBubble>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.type}</p>
                <p className="text-[11px] text-[#98a2b3]">{row.date}</p>
              </div>
              <div className="text-right">
                <p className={row.amount > 0 ? "text-sm font-bold text-emerald-600" : "text-sm font-bold text-[#e10600]"}>{row.amount > 0 ? "+" : ""}{money(row.amount)}</p>
                <StatusBadge tone={row.status}>{row.status}</StatusBadge>
              </div>
            </article>
          );
        })}
      </div>
    </article>
  );
}
