import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import AppIcon from "@/components/common/AppIcon";
import PageHeader from "@/components/common/PageHeader";
import QrCode from "@/components/common/QrCode";
import StatusBadge from "@/components/common/StatusBadge";
import Modal from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { liveTransactions } from "@/lib/ledger";
import { copyText, money, shortHash } from "@/lib/utils";
import InactiveBanner, { useActiveGuard } from "@/components/common/ActiveGate";
import Pager, { usePaging } from "@/components/common/Pager";

const paths = { Deposit: "/wallet/deposit", Withdraw: "/wallet/withdraw", Transfer: "/wallet/transfer" };

export default function Transfer({ mode = "Deposit" }) {
  const navigate = useNavigate();
  const { balances, depositRows, withdrawalRows, transactions, submitWithdrawal, submitTransfer, toast, submitDeposit, depositAddress, walletAddress } = useApp();
  const guard = useActiveGuard();
  const [tab, setTab] = useState(mode);
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferPin, setTransferPin] = useState("");
  const [member, setMember] = useState(null);
  const [memberNote, setMemberNote] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [network, setNetwork] = useState("BEP-20");
  const [amount, setAmount] = useState("20");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTx, setDepositTx] = useState("");
  const [address, setAddress] = useState("");
  const [addressReady, setAddressReady] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setTab(mode), [mode]);

  useEffect(() => {
    if (addressReady || !walletAddress) return;
    setAddress(walletAddress);
    setAddressReady(true);
  }, [walletAddress, addressReady]);

  useEffect(() => {
    if (tab !== "Transfer") return undefined;
    const code = recipient.trim();
    if (code.length < 4) {
      setMember(null);
      setMemberNote("");
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setMemberNote("Checking member...");
      try {
        const data = await apiFetch(`/api/account/member/${encodeURIComponent(code)}`);
        if (cancelled) return;
        setMember(data.member);
        setMemberNote("");
      } catch (error) {
        if (cancelled) return;
        setMember(null);
        setMemberNote(error.message || "Member ID was not found.");
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [recipient, tab]);

  const transfers = liveTransactions(transactions || []).filter((row) => row.type === "Transfer");
  const transferPage = usePaging(transfers, 8, transfers.length);

  const fee = useMemo(() => Number(((Number(amount) || 0) * 0.1).toFixed(2)), [amount]);
  const receive = useMemo(() => Math.max(0, Number(((Number(amount) || 0) - fee).toFixed(2))), [amount, fee]);
  const available = Math.max(0, Number((balances.total - balances.locked).toFixed(2)));

  const sendDeposit = async () => {
    const value = Number(depositAmount);
    if (!Number.isFinite(value) || value < 10) {
      toast("Minimum deposit is 10 USDT.", "warning");
      return;
    }
    setBusy(true);
    const ok = await submitDeposit(network, value, depositTx.trim());
    setBusy(false);
    if (ok) {
      setDepositAmount("");
      setDepositTx("");
    }
  };

  const sendTransfer = async () => {
    setBusy(true);
    const ok = await submitTransfer({ memberId: member?.id || recipient.trim(), amount: transferAmount, pin: transferPin });
    setBusy(false);
    if (ok) {
      setTransferOpen(false);
      setTransferPin("");
      setTransferAmount("");
      setRecipient("");
      setMember(null);
    }
  };

  const submit = async () => {
    setBusy(true);
    const ok = await submitWithdrawal({ amount, address, pin });
    setBusy(false);
    if (ok) {
      setConfirm(false);
      setPin("");
      setAmount("10");
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title={tab}
        subtitle={tab === "Withdraw" ? "Send your available USDT balance to an external BEP-20 wallet." : tab === "Transfer" ? "Send USDT from your wallet to another member. Their balance is credited immediately." : "Add USDT to your ADD FLIX wallet on BEP-20."}
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
        <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="font-bold">Transfer to a member</p>
            <p className="text-sm text-[#667085]">Available balance ${money(available)} USDT. The amount leaves your wallet and is added to theirs.</p>
            <label className="mt-3 block text-xs text-[#667085]">Member ID or username</label>
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="ADD12568" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            {member ? <p className="mt-1 text-xs font-semibold text-emerald-600">Member: {member.name} · {member.id}</p> : null}
            {memberNote ? <p className="mt-1 text-xs text-[#667085]">{memberNote}</p> : null}
            <label className="mt-3 block text-xs text-[#667085]">Amount (USDT)</label>
            <input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Minimum 1 USDT" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            <label className="mt-3 block text-xs text-[#667085]">Transaction Password / PIN</label>
            <input value={transferPin} onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6 digit transaction PIN" inputMode="numeric" autoComplete="off" type="password" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            <Button className="mt-4" onClick={() => {
              if (!guard()) return;
              const value = Number(transferAmount);
              if (!member) {
                toast(memberNote && memberNote !== "Checking member..." ? memberNote : "Enter a valid member ID.", "warning");
                return;
              }
              if (!value || value < 1) {
                toast("Enter a transfer amount of at least 1 USDT.", "warning");
                return;
              }
              if (value > available) {
                toast("Amount cannot exceed your withdrawable balance.", "warning");
                return;
              }
              if (!/^\d{6}$/.test(transferPin)) {
                toast("Enter your 6 digit transaction PIN.", "warning");
                return;
              }
              setTransferOpen(true);
            }}>Send Transfer</Button>
          </article>
          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="mb-3 font-bold">Transfer History</p>
            {transfers.length === 0 ? <p className="py-6 text-center text-sm text-[#98a2b3]">No transfers yet.</p> : null}
            <div className="space-y-2">
              {transferPage.items.map((row) => (
                <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{row.direction === "credit" ? "+" : "−"}${money(Math.abs(row.amount))} USDT</span>
                    <StatusBadge tone={row.status}>{row.status}</StatusBadge>
                  </div>
                  <p className="text-xs text-[#667085]">{row.description || "Member transfer"}</p>
                  <p className="text-xs text-[#98a2b3]">{row.date}</p>
                </article>
              ))}
            </div>
            <Pager page={transferPage.page} pages={transferPage.pages} total={transferPage.total} size={transferPage.size} onChange={transferPage.setPage} />
          </article>
        </section>
      ) : tab === "Deposit" ? (
        <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="font-bold">Deposit USDT to Your Wallet</p>
            <p className="text-sm text-[#667085]">Send USDT to the address below, then enter the amount. Admin confirms it before the balance can be used on an ROI plan.</p>
            <label className="mt-3 block text-xs font-semibold text-[#667085]">Amount (USDT)</label>
            <input
              type="number"
              min="10"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount you sent"
              className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm outline-none focus:border-[#e10600]"
            />
            <p className="mt-1 text-[11px] text-[#98a2b3]">Minimum 10 USDT. This stays Pending until admin marks it Success.</p>
            <label className="mt-3 block text-xs font-semibold text-[#667085]">Transaction hash</label>
            <input
              value={depositTx}
              onChange={(e) => setDepositTx(e.target.value)}
              placeholder="Paste the transaction hash"
              className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm outline-none focus:border-[#e10600]"
            />
            <p className="mt-3 text-xs font-semibold">Select Network</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["BEP-20", "ERC-20", "TRC-20"].map((item) => (
                <button key={item} onClick={() => setNetwork(item)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${network === item ? "border-[#e10600] bg-red-50 text-[#e10600]" : "border-[#eaecf0]"}`}>{item}</button>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#667085]">Wallet Address ({network})</p>
            <p className="mt-1 break-all rounded-xl bg-[#f8fafc] p-3 text-sm">{depositAddress}</p>
            <div className="mt-3 flex items-start gap-3">
              <div className="relative w-28"><QrCode /></div>
              <Button onClick={() => { copyText(depositAddress); toast("Deposit address copied."); }}><Copy size={14} /> Copy Address</Button>
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
            <Button className="mt-3" variant="outline" disabled={busy} onClick={sendDeposit}>{busy ? "Submitting..." : "I Have Sent USDT"}</Button>
          </article>
          <History title="Deposit History" rows={depositRows} kind="deposit" />
        </section>
      ) : (
        <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <p className="font-bold">Withdraw Funds</p>
            <p className="text-sm text-[#667085]">Withdraw your available balance to your external wallet.</p>
            <div className="mt-3 rounded-xl border border-emerald-500 bg-emerald-50 p-3">
              <p className="text-xs text-[#667085]">Available to withdraw</p>
              <p className="font-bold">${money(available)}</p>
              <p className="text-[11px] text-[#667085]">Total ${money(balances.total)} minus locked ${money(balances.locked)}</p>
            </div>
            <label className="mt-3 block text-xs text-[#667085]">Withdrawal Amount (USDT)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            <p className="mt-1 text-[11px] text-[#98a2b3]">Available: ${money(available)} · Minimum: 10 USDT</p>
            <label className="mt-3 block text-xs text-[#667085]">Wallet Address (BEP-20)</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x and 40 hex characters" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
            <label className="mt-3 block text-xs text-[#667085]">Transaction Password / PIN</label>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6 digit transaction PIN" inputMode="numeric" autoComplete="off" type="password" className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm" />
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
              if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
                toast("Enter a valid BEP-20 wallet address.", "warning");
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
        open={transferOpen}
        title="Confirm Transfer"
        onClose={() => setTransferOpen(false)}
        footer={<><Button variant="ghost" className="flex-1" onClick={() => setTransferOpen(false)}>Cancel</Button><Button className="flex-1" disabled={busy} onClick={sendTransfer}>{busy ? "Sending..." : "Send"}</Button></>}
      >
        <p>Send <b>${money(Number(transferAmount) || 0)} USDT</b> to <b>{member?.name}</b> ({member?.id}). Their wallet is credited now, and the same amount leaves your available balance.</p>
      </Modal>

      <Modal
        open={confirm}
        title="Confirm Withdrawal"
        onClose={() => setConfirm(false)}
        footer={<><Button variant="ghost" className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button><Button className="flex-1" disabled={busy} onClick={submit}>{busy ? "Submitting..." : "Confirm"}</Button></>}
      >
        <p>Lock <b>{money(Number(amount) || 0)} USDT</b> for review. Fee {money(fee)} USDT. You receive <b>{money(receive)} USDT</b> when it is paid. Your total balance stays the same until then. Available becomes ${money(Math.max(0, available - (Number(amount) || 0)))}.</p>
      </Modal>
    </div>
  );
}

function History({ title, rows, kind }) {
  const list = usePaging(rows, 8, rows.length);
  return (
    <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
      <p className="mb-3 font-bold">{title}</p>
      <div className="hidden lg:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[#667085]"><tr>{["Date", "TX ID", "Network", "Amount", "Status"].map((h) => <th key={h} className="pb-2 font-medium">{kind === "withdraw" && h === "Network" ? "Receive" : h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-sm text-[#98a2b3]">No records yet.</td></tr> : null}
            {list.items.map((row) => (
              <tr key={row.id} className="border-t border-[#f2f4f7]">
                <td className="py-3">{row.date}</td>
                <td title={row.address || row.tx}>{kind === "withdraw" ? (row.address ? shortHash(row.address) : row.tx) : row.tx}</td>
                <td>{kind === "withdraw" ? `$${money(row.receive)}` : row.network}</td>
                <td>${money(row.amount)}</td>
                <td><StatusBadge tone={row.status}>{row.status}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 lg:hidden">
        {rows.length === 0 ? <p className="py-6 text-center text-sm text-[#98a2b3]">No records yet.</p> : null}
        {list.items.map((row) => (
          <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
            <div className="flex justify-between"><span className="font-semibold">${money(row.amount)} USDT</span><StatusBadge tone={row.status}>{row.status}</StatusBadge></div>
            <p className="text-xs text-[#98a2b3]">{row.date}{kind === "withdraw" && row.receive != null ? ` · receive $${money(row.receive)}` : ""}</p>
            <p className="text-xs">{row.address ? shortHash(row.address) : row.tx}</p>
          </article>
        ))}
      </div>
      <Pager page={list.page} pages={list.pages} total={list.total} size={list.size} onChange={list.setPage} />
    </article>
  );
}
