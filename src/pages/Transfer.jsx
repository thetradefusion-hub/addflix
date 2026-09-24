import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import AppIcon from "@/components/common/AppIcon";
import PageHeader from "@/components/common/PageHeader";
import QrCode from "@/components/common/QrCode";
import StatusBadge from "@/components/common/StatusBadge";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { walletAddress } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { copyText, money } from "@/lib/utils";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";

const paths = { Deposit: "/wallet/deposit", Withdraw: "/wallet/withdraw", Transfer: "/wallet/transfer" };

export default function Transfer({ mode = "Deposit" }) {
  const navigate = useNavigate();
  const { balances, depositRows, withdrawalRows, submitWithdrawal, toast, setDepositRows } = useApp();
  const guard = useActiveGuard();
  const [tab, setTab] = useState(mode);
  const [recipient, setRecipient] = useState("ADF26891");
  const [network, setNetwork] = useState("BEP-20");
  const [amount, setAmount] = useState("20");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState("");
  const [balanceType, setBalanceType] = useState("earning");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => setTab(mode), [mode]);

  const fee = useMemo(() => Number(((Number(amount) || 0) * 0.1).toFixed(2)), [amount]);
  const receive = useMemo(() => Math.max(0, Number(((Number(amount) || 0) - fee).toFixed(2))), [amount, fee]);
  const available = balanceType === "total" ? balances.total : Math.max(0, balances.total - balances.locked);

  const submit = () => {
    const ok = submitWithdrawal({ amount, address, pin });
    if (ok) {
      setConfirm(false);
      setPin("");
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title={tab}
        subtitle={tab === "Withdraw" ? "Send your available USDT balance to an external BEP-20 wallet." : tab === "Transfer" ? "Send USDT to another ADD FLIX member. This demo does not move a real balance." : "Add USDT to your ADD FLIX wallet on BEP-20."}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Wallet", to: "/wallet" }, { label: tab }]}
      />
      {tab !== "Deposit" ? <InactiveBanner /> : null}

      <section className="mb-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Balance", balances.total, "bg-emerald-50 text-emerald-500", "Wallet"],
          ["Deposit Balance", Number((balances.referral + balances.bonus).toFixed(2)), "bg-sky-50 text-sky-500", "ArrowDownToLine"],
          ["Earning Balance", Math.max(0, balances.total - balances.locked), "bg-rose-50 text-rose-500", "HandCoins"],
          ["Locked Balance", balances.locked, "bg-violet-50 text-violet-500", "LockKeyhole"],
        ].map(([label, value, color, icon]) => (
          <article key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3.5 shadow-sm">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${color}`}><AppIcon name={icon} /></span>
            <div className="min-w-0">
              <p className="truncate text-xs text-[#667085]">{label}</p>
              <p className="truncate text-xl font-black">${money(value)}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="mb-3 flex w-fit rounded-xl bg-white p-1">
        {["Deposit", "Withdraw", "Transfer"].map((item) => (
          <button key={item} onClick={() => navigate(paths[item])} className={`rounded-lg px-5 py-2 text-sm font-bold ${tab === item ? "bg-[#e10600] text-white" : "text-[#475467]"}`}>{item}</button>
        ))}
      </div>

      {tab === "Transfer" ? (
        <section className="max-w-xl rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="font-bold">Transfer to a member</p>
          <p className="text-sm text-[#667085]">Available balance ${money(Math.max(0, balances.total - balances.locked))} USDT.</p>
          <label className="mt-3 block text-xs text-[#667085]">Member ID</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
          <label className="mt-3 block text-xs text-[#667085]">Amount (USDT)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
          <Button className="mt-4" onClick={() => {
            if (!guard()) return;
            const value = Number(amount);
            if (!recipient.trim() || recipient.trim().length < 6) {
              toast("Enter a member ID.", "warning");
              return;
            }
            if (!value || value < 1) {
              toast("Enter a transfer amount of at least 1 USDT.", "warning");
              return;
            }
            if (value > balances.total - balances.locked) {
              toast("Amount cannot exceed your withdrawable balance.", "warning");
              return;
            }
            toast(`Transfer of ${money(value)} USDT to ${recipient.trim()} recorded in this demo.`);
          }}>Send Transfer</Button>
        </section>
      ) : tab === "Deposit" ? (
        <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="font-bold">Deposit USDT to Your Wallet</p>
            <p className="text-sm text-[#667085]">Send USDT to the address below. Your wallet will be credited after confirmation.</p>
            <p className="mt-3 text-xs font-semibold">Select Network</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["BEP-20", "ERC-20", "TRC-20"].map((item) => (
                <button key={item} onClick={() => setNetwork(item)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${network === item ? "border-[#e10600] bg-red-50 text-[#e10600]" : "border-[#eaecf0]"}`}>{item}</button>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#667085]">Wallet Address ({network})</p>
            <p className="mt-1 break-all rounded-xl bg-[#f8fafc] p-3 text-sm">{walletAddress}</p>
            <div className="mt-3 flex items-start gap-3">
              <div className="relative w-28"><QrCode /></div>
              <Button onClick={() => { copyText(walletAddress); toast("Deposit address copied."); }}><Copy size={14} /> Copy Address</Button>
            </div>
            <article className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-[#7a4b00]">
              <p className="font-bold">Important Instructions</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Send only USDT using {network} network.</li>
                <li>Do not send from other networks.</li>
                <li>Minimum Deposit: 10 USDT</li>
                <li>Confirmations: 3 – 10 minutes</li>
                <li>Do not send any other coin or token.</li>
              </ul>
            </article>
            <Button className="mt-3" variant="outline" onClick={() => {
              setDepositRows((rows) => [{ id: Date.now(), date: "25 Sep 2026, 12:55 AM", tx: "0xDEMO...A91C", network, amount: 10, status: "Pending" }, ...rows]);
              toast("Deposit is pending confirmation in this demo.");
            }}>I Have Sent USDT</Button>
          </article>
          <History title="Deposit History" rows={depositRows} kind="deposit" />
        </section>
      ) : (
        <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="font-bold">Withdraw Funds</p>
            <p className="text-sm text-[#667085]">Withdraw your available balance to your external wallet.</p>
            <p className="mt-3 text-xs font-semibold">Select Balance Type</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => setBalanceType("earning")} className={`rounded-xl border p-3 text-left text-sm ${balanceType === "earning" ? "border-emerald-500 bg-emerald-50" : "border-[#eaecf0]"}`}>
                <p className="text-xs text-[#667085]">Earning Balance</p>
                <p className="font-bold">${money(Math.max(0, balances.total - balances.locked))}</p>
              </button>
              <button onClick={() => setBalanceType("total")} className={`rounded-xl border p-3 text-left text-sm ${balanceType === "total" ? "border-sky-500 bg-sky-50" : "border-[#eaecf0]"}`}>
                <p className="text-xs text-[#667085]">Total Balance</p>
                <p className="font-bold">${money(balances.total)}</p>
              </button>
            </div>
            <label className="mt-3 block text-xs text-[#667085]">Withdrawal Amount (USDT)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            <p className="mt-1 text-[11px] text-[#98a2b3]">Available: ${money(available)} · Minimum: 10 USDT</p>
            <label className="mt-3 block text-xs text-[#667085]">Wallet Address (BEP-20)</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your USDT wallet address" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            <label className="mt-3 block text-xs text-[#667085]">Transaction Password / PIN</label>
            <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter 6 digit transaction PIN" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            <div className="mt-3 rounded-xl bg-[#f8fafc] p-3 text-sm">
              <div className="flex justify-between"><span>Withdrawal Fee (10%)</span><span>{money(fee)} USDT</span></div>
              <div className="mt-1 flex justify-between font-bold text-emerald-600"><span>You Will Receive</span><span>{money(receive)} USDT</span></div>
            </div>
            <Button className="mt-3 w-full" onClick={() => {
              if (!guard()) return;
              const value = Number(amount);
              if (!value || value < 10) {
                toast("Minimum withdrawal is 10 USDT.", "warning");
                return;
              }
              if (value > available) {
                toast("Amount cannot exceed your withdrawable balance.", "warning");
                return;
              }
              if (!address || address.trim().length < 10) {
                toast("Enter a valid wallet address.", "warning");
                return;
              }
              if (!/^\d{6}$/.test(pin)) {
                toast("Enter your 6 digit transaction PIN.", "warning");
                return;
              }
              setConfirm(true);
            }}>Submit Withdrawal Request</Button>
          </article>
          <History title="Withdrawal History" rows={withdrawalRows} kind="withdraw" />
        </section>
      )}

      <Modal
        open={confirm}
        title="Confirm Withdrawal"
        onClose={() => setConfirm(false)}
        footer={<><Button variant="ghost" className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button><Button className="flex-1" onClick={submit}>Confirm</Button></>}
      >
        <p>Request withdrawal of <b>{money(Number(amount) || 0)} USDT</b>. Fee {money(fee)} USDT. You receive <b>{money(receive)} USDT</b>. Status will be Pending.</p>
      </Modal>
    </div>
  );
}

function History({ title, rows, kind }) {
  return (
    <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
      <p className="mb-3 font-bold">{title}</p>
      <div className="hidden lg:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[#667085]"><tr>{["Date", "TX ID", "Network", "Amount", "Status"].map((h) => <th key={h} className="pb-2 font-medium">{kind === "withdraw" && h === "Network" ? "Receive" : h}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#f2f4f7]">
                <td className="py-3">{row.date}</td>
                <td>{row.tx}</td>
                <td>{kind === "withdraw" ? `$${money(row.receive)}` : row.network}</td>
                <td>${money(row.amount)}</td>
                <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 lg:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
            <div className="flex justify-between"><span className="font-semibold">${money(row.amount)} USDT</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
            <p className="text-xs text-[#98a2b3]">{row.date}</p>
            <p className="text-xs">{row.tx}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
