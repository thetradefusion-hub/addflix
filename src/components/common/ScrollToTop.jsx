import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

/** Layouts scroll inside <main>, the landing page scrolls the window, so reset both. */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll("main").forEach((el) => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
  }, [pathname, search]);

  return null;
}
