import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/data/landingPlan";
import { DarkCard, Heading, Section, reveal, signedIn } from "./LandingChrome";

const joinClass = "inline-flex h-12 items-center justify-center rounded-full bg-[#e10600] px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#c10500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e10600]";
const ghostClass = "inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
          <li className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">Read the terms before you participate.</li>
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
            <Link to={inside ? "/dashboard" : "/register"} className={`${joinClass} w-full shadow-[0_10px_28px_rgba(225,6,0,0.4)] min-[420px]:w-auto`}>{inside ? "Open app" : "Join ADD FLIX"}</Link>
            <a href="#how" className={`${ghostClass} w-full min-[420px]:w-auto`}>See how it works</a>
          </div>
        </div>
      </div>
    </Section>
  );
}
