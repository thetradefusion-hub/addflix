import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { catalogTabs, flow, posters, values, why } from "@/data/landingPlan";
import { DarkCard, FeatureIcon, Heading, Kicker, Section, reveal, signedIn } from "./LandingChrome";

const joinClass = "inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-[#e10600] px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#c10500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e10600]";
const ghostClass = "inline-flex h-12 min-h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function rise(delay) {
  return { className: "landing-rise", style: { "--d": `${delay}ms` } };
}

export function Hero() {
  const inside = signedIn();
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#07080d]">
      <picture>
        <source media="(max-width: 639px)" srcSet="/landing/hero-mobile.jpg" />
        <img src="/landing/hero.jpg" alt="" className="landing-zoom absolute inset-0 h-full w-full object-cover object-center sm:object-[72%_center]" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-b from-[#07080d] via-[#07080d]/35 to-[#07080d]/90 sm:bg-gradient-to-r sm:from-[#07080d] sm:via-[#07080d]/72 sm:to-black/10" />
      <div aria-hidden className="landing-glow pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-[#e10600]/20 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07080d] to-transparent" />
      <div className="relative mx-auto flex min-h-[100svh] max-w-[1180px] items-start px-4 pb-20 pt-28 sm:items-center sm:px-6 sm:py-28">
        <div className="max-w-xl">
          <div {...rise(80)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 backdrop-blur">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e10600]"><Play size={11} fill="currentColor" /></span>
              <Kicker>Premium entertainment meets opportunity</Kicker>
            </span>
          </div>
          <h1 {...rise(180)} className="landing-rise mt-6 max-w-[12ch] text-[2.75rem] font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Watch. Promote. <span className="bg-gradient-to-r from-[#ff3b30] to-[#e10600] bg-clip-text text-transparent">Earn.</span>
          </h1>
          <p {...rise(300)} className="landing-rise mt-6 text-lg font-medium text-white sm:text-xl">The future of entertainment and smart earning</p>
          <p {...rise(380)} className="landing-rise mt-3 max-w-md text-sm leading-6 text-white/75 sm:text-base sm:leading-7">Experience entertainment while exploring a business opportunity built around one platform.</p>
          <div {...rise(480)} className="landing-rise mt-9 flex flex-col gap-3 min-[420px]:flex-row">
            <Link to={inside ? "/dashboard" : "/auth?join=1"} className={`${joinClass} w-full shadow-[0_10px_28px_rgba(225,6,0,0.4)] min-[420px]:w-auto`}>{inside ? "Open app" : "Join ADD FLIX"}</Link>
            <a href="#business" className={`${ghostClass} w-full bg-black/20 backdrop-blur min-[420px]:w-auto`}>Explore Business Plan</a>
          </div>
          <p {...rise(580)} className="landing-rise mt-7 text-xs tracking-wide text-white/55">A new way to watch, share and earn with ADD FLIX.</p>
        </div>
      </div>
    </section>
  );
}

export function ValueStrip() {
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-[1180px] px-4 sm:px-6" aria-label="What ADD FLIX offers">
      <ul {...reveal()} className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)] min-[480px]:grid-cols-2 lg:grid-cols-5">
        {values.map((item) => (
          <li key={item.title} className="flex items-center gap-3 bg-[#0e1017]/95 px-5 py-5 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-[#151821]">
            <FeatureIcon name={item.icon} />
            <span className="leading-5">{item.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function About() {
  return (
    <Section id="about" className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <Heading className="mb-0 sm:mb-0" kicker="About ADD FLIX" title="Entertainment beyond limits" text="ADD FLIX puts digital entertainment and a business opportunity on one platform. Members watch content, share a referral link, and follow a published plan for how credit is calculated." />
        <div {...reveal(120)}><a href="#how" className={`${joinClass} mt-8 w-full min-[420px]:w-auto`}>Learn more</a></div>
      </div>
      <div className="grid gap-4">
        <DarkCard delay={80}>
          <FeatureIcon name="Globe" />
          <h3 className="mt-4 text-lg font-semibold">Our vision</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">To build a global platform where entertainment and opportunity come together.</p>
        </DarkCard>
        <DarkCard delay={180}>
          <FeatureIcon name="BadgeCheck" />
          <h3 className="mt-4 text-lg font-semibold">Our mission</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">To offer premium entertainment while keeping the business opportunity clear for the ADD FLIX community.</p>
        </DarkCard>
      </div>
    </Section>
  );
}

export function Why() {
  return (
    <Section>
      <Heading center kicker="Why ADD FLIX?" title="More than entertainment" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {why.map((item, index) => (
          <DarkCard key={item.title} delay={(index % 3) * 90} className="h-full">
            <FeatureIcon name={item.icon} />
            <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
          </DarkCard>
        ))}
      </div>
    </Section>
  );
}

export function Entertainment() {
  const [tab, setTab] = useState("Movies");
  const row = useMemo(() => posters.filter((item) => item.tag === tab).slice(0, 4), [tab]);
  return (
    <Section id="entertainment">
      <div className="mb-10 flex flex-col gap-6 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <Heading className="mb-0 sm:mb-0" kicker="Entertainment" title="Watch your favorite content" text="Sample titles for the library layout. The live list is the video library published for members." />
        <div {...reveal(100)} className="grid grid-cols-4 gap-1 rounded-full border border-white/10 bg-white/5 p-1 sm:flex sm:self-start lg:shrink-0">
          {catalogTabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`h-9 whitespace-nowrap rounded-full px-2 text-[11px] sm:px-4 sm:text-xs font-semibold transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e10600] ${tab === item ? "bg-[#e10600] text-white shadow-[0_6px_18px_rgba(225,6,0,0.35)]" : "text-white/70 hover:text-white"}`}>{item}</button>
          ))}
        </div>
      </div>
      <div {...reveal(140)}>
      <ul key={tab} className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
        {row.map((item, index) => (
          <li key={item.title} className="landing-rise group w-[68%] max-w-[240px] shrink-0 snap-start sm:w-auto sm:max-w-none" style={{ "--d": `${index * 80}ms` }}>
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <img src={item.image} alt="" className="aspect-[3/4] w-full object-cover transition duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
              <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-90 place-items-center rounded-full bg-[#e10600] text-white opacity-0 shadow-[0_10px_30px_rgba(225,6,0,0.5)] transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                <Play size={18} fill="currentColor" />
              </span>
              <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur">{item.tag}</span>
            </div>
            <p className="mt-3 truncate text-sm font-semibold">{item.title}</p>
          </li>
        ))}
      </ul>
      </div>
    </Section>
  );
}

export function HowItWorks() {
  return (
    <Section id="how">
      <Heading center kicker="How it works" title="A simple way to watch, promote and earn" text="Four steps from the first video to a growing network." />
      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <span className="pointer-events-none absolute left-[12%] right-[12%] top-[2.75rem] hidden h-px bg-gradient-to-r from-transparent via-[#e10600]/50 to-transparent lg:block" aria-hidden="true" />
        {flow.map((item, index) => (
          <li key={item.step} {...reveal(index * 110)} className="landing-lift relative rounded-2xl border border-white/10 bg-[#101219] p-5 text-center hover:border-[#e10600]/35 sm:p-6">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#e10600] bg-[#07080d] text-sm font-semibold text-[#e10600] shadow-[0_0_0_6px_rgba(225,6,0,0.08)]">{item.step}</span>
            <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
