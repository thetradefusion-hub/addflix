import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { faqs, productionLevels, ranks, subscriptionLevels } from "@/data/landingPlan";
import { DarkCard, Heading, Kicker, Section, reveal, signedIn } from "./LandingChrome";

const joinClass = "inline-flex h-12 items-center justify-center rounded-full bg-[#e10600] px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#c10500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e10600]";
const ghostClass = "inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const cardTitle = "mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-[1.7rem]";
const pad = "px-5 sm:px-6";

function Join({ children, className = "" }) {
  const inside = signedIn();
  return <Link to={inside ? "/dashboard" : "/auth?join=1"} className={`${joinClass} ${className}`}>{inside ? "Open app" : children}</Link>;
}

function Figure({ value, label, accent = false }) {
  return (
    <p>
      <span className={`block text-4xl font-semibold tracking-tight sm:text-5xl ${accent ? "text-[#e10600]" : ""}`}>{value}</span>
      <span className="mt-1.5 block text-xs text-white/50">{label}</span>
    </p>
  );
}

function Plans() {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <DarkCard className="flex h-full flex-col">
        <Kicker>Subscription plan</Kicker>
        <h3 className={cardTitle}>One subscription. Multiple opportunities.</h3>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Figure value="$10" label="One subscription" />
          <Figure value="20%" label="Level 1 referral" accent />
        </div>
        <ul className="mt-6 text-sm">
          {subscriptionLevels.map((row) => (
            <li key={row.level} className="flex items-center justify-between gap-3 border-t border-white/10 py-3 text-white/75">
              <span>{row.level}</span><span className="font-semibold text-white">{row.amount}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6"><Join className="w-full sm:w-auto">Join Now</Join></div>
      </DarkCard>
      <DarkCard delay={120} className="grid h-full gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(140px,42%)] sm:items-stretch">
        <div className="flex flex-col">
          <Kicker>Production investment plan</Kicker>
          <h3 className={cardTitle}>One production. Multiple benefits.</h3>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-1 xl:grid-cols-2">
            <Figure value="$100" label="Minimum" />
            <p className="min-w-0"><span className="block text-3xl font-semibold tracking-tight lg:text-[2rem]">Unlimited</span><span className="mt-1.5 block text-xs text-white/50">Multiple investment</span></p>
          </div>
          <a href="#profit" className={`${ghostClass} mt-6 w-full sm:mt-auto sm:w-auto`}>Explore Production Plan</a>
        </div>
        <div className="overflow-hidden rounded-xl">
          <img src="/landing/camera.jpg" alt="Cinema camera on a film set" className="h-48 w-full object-cover transition duration-700 ease-out hover:scale-105 sm:h-full sm:min-h-48" />
        </div>
      </DarkCard>
    </div>
  );
}

function ProfitAndReferral() {
  return (
    <div id="profit" className="grid scroll-mt-24 gap-4 lg:grid-cols-2">
      <DarkCard className="h-full">
        <Kicker>Production profit sharing</Kicker>
        <h3 className={cardTitle}>Earn through production with long-term potential</h3>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Figure value="2.5%" label="Weekly, as listed" />
          <Figure value="200%" label="Up to, total listed" />
        </div>
        <ul className="mt-6 text-sm text-white/70">
          {["Regular weekly profit", "High profit potential", "Business model"].map((label) => (
            <li key={label} className="flex items-center gap-2 border-t border-white/10 py-3"><span className="h-1.5 w-1.5 rounded-full bg-[#e10600]" />{label}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-5 text-white/40">These figures are the business-plan structure. They are not a guaranteed return.</p>
      </DarkCard>
      <DarkCard delay={120} className="flex h-full flex-col">
        <Kicker>Direct referral income</Kicker>
        <h3 className={cardTitle}>Earn 5% on direct referrals</h3>
        <p className="mt-6 text-6xl font-semibold tracking-tight text-[#e10600]">5%</p>
        <p className="mt-3 text-sm leading-6 text-white/60">Direct referral income on production, separate from the 20% on a successful $10 subscription.</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-6 text-xs text-white/75">
          {["You", "Direct member", "5% credit"].map((label, index) => (
            <span key={label} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true" className="text-white/30">→</span> : null}
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{label}</span>
            </span>
          ))}
        </div>
      </DarkCard>
    </div>
  );
}

function LevelAndRank() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DarkCard still className="overflow-hidden p-0 sm:p-0">
        <div className={`${pad} pt-6`}>
          <Kicker>Production level income</Kicker>
          <h3 className={cardTitle}>15 levels of earning opportunity</h3>
        </div>
        <ul className="mt-5 divide-y divide-white/10 md:hidden">
          {productionLevels.map((row) => (
            <li key={row.level} className={`flex items-center justify-between py-3 text-sm ${pad}`}>
              <span className="text-white/70">{row.level} level</span>
              <span className="font-semibold">{row.rate}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 hidden md:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Production level income</caption>
            <thead className="text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-6 py-2 font-medium">Level</th>
                <th className="px-3 py-2 font-medium">Income</th>
                <th className="px-3 py-2 font-medium">Level</th>
                <th className="px-6 py-2 font-medium">Income</th>
              </tr>
            </thead>
            <tbody>
              {productionLevels.slice(0, 8).map((left, index) => {
                const right = productionLevels[index + 8];
                return (
                  <tr key={left.level} className="border-t border-white/10 transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-3 text-white/70">{left.level}</td>
                    <td className="px-3 py-3 font-semibold">{left.rate}</td>
                    <td className="px-3 py-3 text-white/70">{right ? right.level : ""}</td>
                    <td className="px-6 py-3 font-semibold">{right ? right.rate : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={`border-t border-white/10 py-4 text-xs leading-5 text-white/45 ${pad}`}>Calculated on the daily ROI your team claims, not on the investment. An active ID and one direct referral are compulsory.</p>
      </DarkCard>
      <DarkCard still delay={120} className="overflow-hidden p-0 sm:p-0">
        <div className={`${pad} pt-6`}>
          <Kicker>Rank and salary plan</Kicker>
          <h3 className={cardTitle}>Grow your rank, increase your earnings</h3>
        </div>
        <table className="mt-5 w-full text-left text-sm">
          <caption className="sr-only">Rank and salary</caption>
          <thead className="text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-5 py-2 font-medium sm:px-6">Rank</th>
              <th className="px-5 py-2 text-right font-medium sm:px-6">Salary</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map(([rank, salary]) => (
              <tr key={rank} className="border-t border-white/10 transition-colors hover:bg-white/[0.03]">
                <td className="px-5 py-3 text-white/75 sm:px-6">{rank}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right font-semibold sm:px-6">{salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={`border-t border-white/10 py-4 text-xs leading-5 text-white/45 ${pad}`}>A rank applies only when its business-plan criteria are met. Salary is not automatic.</p>
      </DarkCard>
    </div>
  );
}

export function BusinessPlan() {
  return (
    <Section id="business">
      <Heading center kicker="Business plan" title="A clear plan for every member" text="Subscription, production, referral and rank figures as published in the ADD FLIX business plan." />
      <div className="grid gap-4">
        <Plans />
        <ProfitAndReferral />
        <LevelAndRank />
      </div>
    </Section>
  );
}

export function Faq() {
  const mid = Math.ceil(faqs.length / 2);
  const columns = [faqs.slice(0, mid), faqs.slice(mid)];
  return (
    <Section id="faq">
      <Heading center kicker="Frequently asked questions" title="Your questions, answered" />
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        {columns.map((column, col) => (
          <div key={column[0].q} className="space-y-3">
            {column.map((item, index) => (
              <details key={item.q} {...reveal((col + index) * 60)} className="group rounded-2xl border border-white/10 bg-[#101219] px-5 transition-colors duration-300 hover:border-white/20 open:border-[#e10600]/35 open:bg-[#151821]">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e10600] [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/5 text-white/60 transition duration-300 group-open:rotate-180 group-open:bg-[#e10600] group-open:text-white">
                    <ChevronDown size={15} />
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-6 text-white/60">{item.a}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Closing() {
  const inside = signedIn();
  return (
    <Section className="grid gap-4">
      <DarkCard still>
        <h2 className="text-lg font-semibold">Before you join</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-white/60 sm:grid-cols-2">
          <li className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">Read the business plan and the terms before you participate.</li>
          <li className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">You are responsible for the laws that apply where you live.</li>
          <li className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">Rewards follow the stated criteria. They are not automatic and they are not guaranteed.</li>
          <li className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">ADD FLIX can update policies under its terms.</li>
        </ul>
      </DarkCard>
      <div {...reveal(100)} className="group relative isolate min-h-[300px] overflow-hidden rounded-2xl border border-white/10 bg-[#07080d] sm:min-h-[340px]">
        <img src="/landing/cta.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_center] transition duration-[1.6s] ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35 sm:bg-gradient-to-r sm:from-black sm:via-black/80 sm:to-black/20" />
        <div aria-hidden className="landing-glow pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[#e10600]/25 blur-3xl" />
        <div className="relative flex min-h-[300px] max-w-xl flex-col justify-end px-6 py-8 sm:min-h-[340px] sm:justify-center sm:px-10 sm:py-12">
          <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">Ready to watch, promote and earn?</h2>
          <p className="mt-4 text-sm leading-6 text-white/75 sm:text-base sm:leading-7">Explore the ADD FLIX platform and see how entertainment and opportunity come together.</p>
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
            <Link to={inside ? "/dashboard" : "/auth?join=1"} className={`${joinClass} w-full shadow-[0_10px_28px_rgba(225,6,0,0.4)] min-[420px]:w-auto`}>{inside ? "Open app" : "Join ADD FLIX"}</Link>
            <a href="#business" className={`${ghostClass} w-full min-[420px]:w-auto`}>View Business Plan</a>
          </div>
        </div>
      </div>
    </Section>
  );
}
