import { useState } from "react";
import { CircleCheck, Copy, Crown } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import QrCode from "@/components/common/QrCode";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { activationLabel, copyText, shortHash } from "@/lib/utils";
import Pager, { usePaging } from "@/components/common/Pager";

const steps = ["Make Payment", "Submit TX Hash", "Verification", "Account Activated"];

export default function Subscription() {
  const { subscriptionActive, paymentState, activatedAt, subscriptionPayments, submitSubscription, toast, depositAddress, subscriptionPrice } = useApp();
  const [hash, setHash] = useState("");
  const [tab, setTab] = useState("qr");
  const step = subscriptionActive ? 4 : paymentState === "pending" ? 3 : hash ? 2 : 1;
  const history = usePaging(subscriptionPayments, 8, subscriptionPayments.length);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="My Subscription"
        subtitle={`Activate your account with $${subscriptionPrice} USDT subscription to start earning.`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "My Subscription" }]}
      />

      {subscriptionActive ? (
        <section className="mb-4 overflow-hidden rounded-2xl bg-[#07140f] p-4 text-white sm:p-5">
          <div className="grid items-center gap-4 lg:grid-cols-[1.2fr_auto_1fr]">
            <div>
              <p className="text-2xl font-black">Account Activated</p>
              <p className="mt-1 max-w-sm text-sm text-white/70">Your ${subscriptionPrice} USDT subscription is active. Daily tasks, referral income and investment plans are unlocked.</p>
              <p className="mt-3 text-xs font-semibold text-emerald-300">Activated {activatedAt ? activationLabel(activatedAt) : "for lifetime"}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-4 text-center">
              <CircleCheck className="mx-auto text-emerald-400" size={28} />
              <p className="mt-1 text-2xl font-black text-emerald-300">Active</p>
              <p className="text-xs text-white/60">Lifetime access</p>
            </div>
            <ul className="space-y-1 text-sm">
              {["ID is active", "Daily tasks unlocked", "Referral income enabled", "Investment plans open"].map((item) => (
                <li key={item} className="flex items-center gap-2"><CircleCheck size={14} className="text-emerald-400" />{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="mb-4 overflow-hidden rounded-2xl bg-[#12080c] p-4 text-white sm:p-5">
          <div className="grid items-center gap-4 lg:grid-cols-[1.2fr_auto_1fr]">
            <div>
              <p className="text-2xl font-black">Activate Your Account</p>
              <p className="mt-1 max-w-sm text-sm text-white/70">Get full access to earning platform, daily tasks, referral income and investment plans.</p>
            </div>
            <div className="rounded-2xl border border-red-500/40 bg-black/40 px-6 py-4 text-center">
              <Crown className="mx-auto text-amber-300" />
              <p className="text-4xl font-black text-[#ff2a2a]">${subscriptionPrice} <span className="text-lg">USDT</span></p>
            </div>
            <ul className="space-y-1 text-sm">
              {["Activate Your ID", "Start Earning", "Enable Referral Income", "Access All Features"].map((item) => (
                <li key={item} className="flex items-center gap-2"><CircleCheck size={14} className="text-emerald-400" />{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {!subscriptionActive ? (
      <section className="mb-4 rounded-2xl border border-[#eaecf0] bg-white p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {steps.map((label, index) => (
            <div key={label}>
              <span className={`mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${index < step ? "bg-[#e10600] text-white" : "bg-slate-100 text-slate-400"}`}>{index + 1}</span>
              <p className="text-[11px] font-semibold sm:text-xs">{label}</p>
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {paymentState === "pending" && !subscriptionActive ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Payment is waiting for admin review. Your ID stays inactive until an admin marks it Success.</p>
        </div>
      ) : null}
      {paymentState === "failed" ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Last payment failed. Send ${subscriptionPrice} USDT again and submit a new transaction hash.
        </div>
      ) : null}

      <section className={`grid gap-3 ${subscriptionActive ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="mb-3 font-bold">Subscription Details <StatusBadge tone={subscriptionActive ? "active" : "danger"}>{subscriptionActive ? "Active" : "Mandatory"}</StatusBadge></p>
          <dl className="space-y-2 text-sm">
            {[
              ["Subscription Amount", `$${subscriptionPrice} USDT`],
              ["Network", "BEP-20 (BSC)"],
              ["Plan Type", "Account Activation"],
              ["Validity", "Lifetime"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-[#f2f4f7] py-2">
                <dt className="text-[#667085]">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm font-semibold">Benefits</p>
          <ul className="mt-2 space-y-1 text-sm text-[#475467]">
            {(subscriptionActive
              ? ["ID is active", "Daily tasks are open", "Referral income is on", "Investment plans are open", "Withdrawals are open", "Full platform access"]
              : ["Activate your ID", "Access daily tasks", "Earn referral income (4 Levels)", "Invest in earning plans", "Withdraw your earnings", "Full platform access"]
            ).map((item) => (
              <li key={item} className="flex gap-2"><CircleCheck size={14} className="text-emerald-500" />{item}</li>
            ))}
          </ul>
        </article>

        {!subscriptionActive ? (
        <>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <div className="mb-3 flex gap-2">
            {[["qr", "Scan QR Code"], ["address", "Copy Address"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === id ? "bg-[#111] text-white" : "bg-slate-100"}`}>{label}</button>
            ))}
          </div>
          <div className="relative mx-auto w-40">
            <QrCode />
          </div>
          <p className="mt-3 break-all rounded-xl bg-[#f8fafc] p-2 text-center text-xs">{depositAddress}</p>
          <Button className="mt-3 w-full" onClick={() => { copyText(depositAddress); toast("Deposit address copied."); }}>
            <Copy size={14} /> Copy Deposit Address
          </Button>
          <p className="mt-2 text-center text-[11px] text-[#98a2b3]">Send exactly {subscriptionPrice} USDT using BEP-20 (BSC) network only.</p>
        </article>

        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="font-bold">Submit Transaction</p>
          <label className="mt-3 block text-xs font-medium text-[#667085]">Transaction Hash (TXID)</label>
          <input value={hash} onChange={(e) => setHash(e.target.value)} placeholder="Enter transaction hash here..." className="mt-1 h-11 w-full rounded-xl border border-[#eaecf0] px-3 text-sm outline-none focus:border-[#e10600]" />
          <div className="mt-3 grid h-20 place-items-center rounded-xl border border-dashed border-[#d0d5dd] text-xs text-[#98a2b3]">
            Payment screenshot optional · PNG, JPG (Max 5MB)
          </div>
          <Button className="mt-3 w-full" disabled={paymentState === "pending" || subscriptionActive} onClick={() => submitSubscription(hash)}>
            {paymentState === "pending" ? "Pending verification" : subscriptionActive ? "Payment Verified" : "Submit for Verification"}
          </Button>
          {!subscriptionActive && paymentState !== "pending" ? (
            <Button className="mt-2 w-full" variant="dark" onClick={() => submitSubscription(`0xDEMO${Date.now()}`)}>Submit demo hash</Button>
          ) : null}
        </article>
        </>
        ) : null}
      </section>

      <section className={`mt-3 grid gap-3 ${subscriptionActive ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {!subscriptionActive ? (
        <article className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm">
          <p className="font-bold">Important Instructions</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[#475467]">
            <li>Send exactly {subscriptionPrice} USDT using BEP-20 (BSC) network.</li>
            <li>Do not send from other network (ERC20, TRC20, etc).</li>
            <li>After payment, enter the correct transaction hash.</li>
            <li>Verification may take a few minutes.</li>
            <li>Your account will be activated after successful verification.</li>
          </ol>
        </article>
        ) : null}
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4 text-center">
          <Crown className={`mx-auto ${subscriptionActive ? "text-emerald-500" : "text-[#e10600]"}`} />
          <p className="mt-2 text-lg font-black">{subscriptionActive ? "Active" : "Not Active"}</p>
          <p className="text-xs text-[#667085]">{subscriptionActive ? "Your account is ready to earn." : paymentState === "pending" ? "Waiting for payment verification." : paymentState === "failed" ? "Last payment failed." : "Complete payment to activate your account."}</p>
          <StatusBadge className="mt-3" tone={subscriptionActive ? "active" : paymentState === "failed" ? "danger" : "pending"}>{subscriptionActive ? "Activated" : paymentState === "pending" ? "Pending" : paymentState === "failed" ? "Failed" : "Waiting for Payment"}</StatusBadge>
        </article>
        <article className="rounded-2xl border border-[#eaecf0] bg-white p-4">
          <p className="font-bold">Subscription History</p>
          <div className="mt-3 space-y-2">
            {history.total ? history.items.map((row) => (
              <div key={row.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm">
                <div className="flex justify-between gap-2"><span>{row.verifiedAt || row.submittedAt}</span><StatusBadge tone={row.status === "Success" ? "success" : row.status === "Failed" ? "danger" : "pending"}>{row.status}</StatusBadge></div>
                <p className="mt-1 font-semibold">${Number(row.amount).toFixed(2)} USDT · {row.network}</p>
                <p className="text-xs text-[#98a2b3]">TX {shortHash(row.txHash, 6, 4)}</p>
              </div>
            )) : (
              <p className="py-6 text-center text-sm text-[#98a2b3]">No subscription found. Complete your subscription to get started.</p>
            )}
          </div>
          <Pager page={history.page} pages={history.pages} total={history.total} size={history.size} onChange={history.setPage} />
        </article>
      </section>
    </div>
  );
}
