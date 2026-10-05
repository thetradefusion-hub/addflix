import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Menu, X } from "lucide-react";
import Logo from "@/components/layout/Logo";
import AppIcon from "@/components/common/AppIcon";
import { cn } from "@/lib/utils";
import { footerLinks, legalLinks, navLinks } from "@/data/landingPlan";

export function signedIn() {
  return Boolean(localStorage.getItem("addflix_token"));
}

const joinClass = "inline-flex h-10 items-center justify-center rounded-full bg-[#e10600] px-4 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(225,6,0,0.38)] hover:bg-[#c10500]";
const loginClass = "inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/10";

function isCurrent(hash, to) {
  return hash === to || (to === "#top" && (!hash || hash === "#top"));
}

function AccountActions({ inside, onNavigate, stacked = false }) {
  return (
    <div className={cn("flex items-center gap-2", stacked && "flex-col items-stretch")}>
      <Link to={inside ? "/dashboard" : "/auth"} onClick={onNavigate} className={loginClass}>{inside ? "Dashboard" : "Login"}</Link>
      <Link to={inside ? "/dashboard" : "/register"} onClick={onNavigate} className={joinClass}>{inside ? "Open app" : "Join Now"}</Link>
    </div>
  );
}

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("#top");
  const [scrolled, setScrolled] = useState(false);
  const inside = signedIn();

  useEffect(() => {
    const ids = navLinks.map(([to]) => to).filter((to) => to !== "#top");
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        const line = window.innerHeight * 0.35;
        let current = "#top";
        ids.forEach((id) => {
          const node = document.querySelector(id);
          if (node && node.getBoundingClientRect().top <= line) current = id;
        });
        setHash(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className={cn("mx-auto flex h-16 max-w-[1180px] items-center gap-3 rounded-2xl border px-3 transition duration-300 sm:px-4", solid ? "border-white/12 bg-[#0b0d12]/92 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl" : "border-white/10 bg-black/35 backdrop-blur-md")}>
        <Link to="/" aria-label="ADD FLIX home" onClick={() => setOpen(false)} className="shrink-0">
          <Logo className="h-10 sm:h-11" />
        </Link>
        <nav className="mx-auto hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex" aria-label="Landing">
          {navLinks.map(([to, label]) => {
            const active = isCurrent(hash, to);
            return (
              <a key={to} href={to} className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e10600]", active ? "theme-fixed bg-white text-[#111] shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white")}>
                {label}
              </a>
            );
          })}
        </nav>
        <div className="ml-auto hidden lg:block"><AccountActions inside={inside} /></div>
        <Link to={inside ? "/dashboard" : "/auth"} className={`${joinClass} ml-auto h-9 px-3.5 lg:hidden`}>{inside ? "App" : "Login"}</Link>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 lg:hidden" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open ? (
        <nav className="mx-auto mt-2 max-w-[1180px] rounded-2xl border border-white/10 bg-[#0b0d12]/95 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden" aria-label="Mobile">
          {navLinks.map(([to, label]) => {
            const active = isCurrent(hash, to);
            return (
              <a key={to} href={to} onClick={() => setOpen(false)} className={cn("flex items-center justify-between rounded-xl px-3 py-3.5 text-base", active ? "theme-fixed bg-white font-semibold text-[#111]" : "text-white/80 hover:bg-white/5")}>
                {label}
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-[#e10600]" /> : null}
              </a>
            );
          })}
          <div className="mt-2 border-t border-white/10 pt-3"><AccountActions inside={inside} stacked onNavigate={() => setOpen(false)} /></div>
        </nav>
      ) : null}
    </header>
  );
}

const footLink = "group inline-flex items-center text-sm text-white/60 transition-colors hover:text-white";

function FootLink({ to, children }) {
  const body = (
    <>
      <span className="h-px w-0 bg-[#e10600] transition-all duration-300 group-hover:mr-2 group-hover:w-3" />
      {children}
    </>
  );
  return to.startsWith("/") ? <Link className={footLink} to={to}>{body}</Link> : <a className={footLink} href={to}>{body}</a>;
}

function FootColumn({ title, links, delay }) {
  return (
    <div {...reveal(delay)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{title}</p>
      <ul className="mt-5 space-y-3">
        {links.map(([to, label]) => <li key={label}><FootLink to={to}>{label}</FootLink></li>)}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  const inside = signedIn();
  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-[#05060a] text-white">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e10600]/70 to-transparent" />
      <div aria-hidden className="landing-glow pointer-events-none absolute -top-40 left-1/2 -z-10 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-[#e10600]/10 blur-3xl" />

      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div {...reveal()} className="flex flex-col gap-6 border-b border-white/10 py-10 sm:py-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <Link to="/" aria-label="ADD FLIX home" className="relative inline-block">
              <span aria-hidden className="pointer-events-none absolute -inset-x-4 -inset-y-2 rounded-full bg-[#e10600]/25 blur-2xl" />
              <Logo className="relative h-14" />
            </Link>
            <p className="mt-4 text-sm leading-6 text-white/55">A global platform where entertainment and opportunity come together.</p>
          </div>
          <div className="flex flex-col gap-3 min-[420px]:flex-row">
            <Link to={inside ? "/dashboard" : "/register"} className={`${joinClass} h-12 px-6`}>{inside ? "Open app" : "Join ADD FLIX"}</Link>
            <Link to={inside ? "/dashboard" : "/auth"} className={`${loginClass} h-12 px-6`}>{inside ? "Dashboard" : "Login"}</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-14 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
          <div {...reveal()} className="col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">ADD FLIX</p>
            <p className="mt-5 text-lg font-semibold">Watch • Promote • Earn</p>
            <ul className="mt-5 flex flex-wrap gap-2 text-xs text-white/70">
              {["Premium entertainment", "USDT · BEP-20", "Member library"].map((label) => (
                <li key={label} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{label}</li>
              ))}
            </ul>
          </div>
          <FootColumn title="Explore" links={footerLinks} delay={80} />
          <FootColumn title="Legal" links={legalLinks} delay={160} />
          <div {...reveal(240)} className="col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Support</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-b from-[#151821] to-[#101219] p-5">
              <div className="flex items-center gap-3">
                <FeatureIcon name="Headphones" />
                <div>
                  <p className="text-sm font-semibold">Need help?</p>
                  <p className="text-xs text-white/50">10:00–19:00 IST, Mon–Sat</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <FootLink to="/support">Open a ticket</FootLink>
                <FootLink to="/legal/contact">Contact us</FootLink>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ADD FLIX. All rights reserved.</p>
          <p className="max-w-md leading-5 sm:text-center">Rewards follow the published criteria and are not guaranteed.</p>
          <a href="#top" className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 px-3 py-1.5 text-white/60 transition hover:-translate-y-0.5 hover:border-white/25 hover:text-white sm:self-auto">
            Back to top <ArrowUp size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export function PublicFrame({ children }) {
  const inside = signedIn();
  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#101828]">
      <header className="flex h-16 items-center justify-between bg-[#07080d] px-4">
        <Link to="/" aria-label="ADD FLIX home"><Logo className="h-10" /></Link>
        <Link to={inside ? "/dashboard" : "/auth"} className={joinClass}>{inside ? "Dashboard" : "Login"}</Link>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}

export function Kicker({ children }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e10600]">{children}</p>;
}

export function reveal(delay = 0) {
  return { "data-reveal": "", style: { "--d": `${delay}ms` } };
}

export function DarkCard({ className, children, delay = 0, still = false }) {
  return (
    <article {...reveal(delay)} className={cn("rounded-2xl border border-white/10 bg-gradient-to-b from-[#151821] to-[#101219] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)] sm:p-6", !still && "landing-lift hover:border-[#e10600]/35", className)}>
      {children}
    </article>
  );
}

export function Section({ id, className, children }) {
  return (
    <section id={id} className={cn("scroll-mt-20 mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 sm:py-20 lg:py-24", className)}>
      {children}
    </section>
  );
}

export function Heading({ kicker, title, text, center = false, className }) {
  return (
    <div {...reveal()} className={cn("mb-10 sm:mb-12", center ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <h2 className={cn("text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]", kicker && "mt-3")}>{title}</h2>
      {text ? <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">{text}</p> : null}
    </div>
  );
}

export function FeatureIcon({ name }) {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e10600]/15 text-[#e10600] ring-1 ring-[#e10600]/25">
      <AppIcon name={name} size={19} />
    </span>
  );
}
