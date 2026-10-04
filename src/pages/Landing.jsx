import { useEffect, useRef } from "react";
import LandingNav, { LandingFooter, PublicFrame } from "@/components/landing/LandingChrome";
import { About, Entertainment, Hero, HowItWorks, ValueStrip, Why } from "@/components/landing/LandingStory";
import { BusinessPlan, Closing, Faq } from "@/components/landing/LandingPlan";

export { PublicFrame };

function useReveal(rootRef, enabled) {
  useEffect(() => {
    if (!enabled || !rootRef.current) return undefined;
    const root = rootRef.current;
    const pending = () => root.querySelectorAll("[data-reveal]:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      pending().forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    const watch = () => pending().forEach((node) => observer.observe(node));
    watch();
    const mutations = new MutationObserver(watch);
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [rootRef, enabled]);
}

export default function Landing({ frame = false, children }) {
  const rootRef = useRef(null);
  useReveal(rootRef, !frame);

  useEffect(() => {
    if (frame) return undefined;
    const previous = document.title;
    document.title = "ADD FLIX — Watch, Promote & Earn";
    document.documentElement.classList.add("landing-smooth");
    return () => {
      document.title = previous;
      document.documentElement.classList.remove("landing-smooth");
    };
  }, [frame]);

  if (frame) return <PublicFrame>{children}</PublicFrame>;

  return (
    <div id="top" ref={rootRef} className="landing min-h-screen overflow-x-hidden bg-[#07080d] text-white">
      <LandingNav />
      <main>
        <Hero />
        <ValueStrip />
        <About />
        <Why />
        <Entertainment />
        <HowItWorks />
        <BusinessPlan />
        <Faq />
        <Closing />
      </main>
      <LandingFooter />
    </div>
  );
}
