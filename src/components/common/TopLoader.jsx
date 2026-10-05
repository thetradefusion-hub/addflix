import { useEffect, useState } from "react";
import { setPending, subscribePending } from "@/lib/api";

const SHOW_AFTER_MS = 120;
const CLICK_WINDOW_MS = 400;

export default function TopLoader() {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let timer = 0;
    let lastClick = null;
    let lastClickAt = 0;
    let previous = 0;
    const busyButtons = new Set();

    const onClick = (event) => {
      const button = event.target instanceof Element ? event.target.closest("button, [role='button']") : null;
      if (!button || button.dataset.loading === "true") return;
      lastClick = button;
      lastClickAt = performance.now();
    };
    document.addEventListener("click", onClick, true);

    const stop = subscribePending((count) => {
      clearTimeout(timer);
      if (count > previous && lastClick && performance.now() - lastClickAt < CLICK_WINDOW_MS && lastClick.isConnected) {
        lastClick.dataset.busy = "true";
        lastClick.setAttribute("aria-busy", "true");
        busyButtons.add(lastClick);
        lastClick = null;
      }
      if (count > 0) {
        timer = setTimeout(() => setBusy(true), SHOW_AFTER_MS);
      } else {
        setBusy(false);
        busyButtons.forEach((button) => {
          delete button.dataset.busy;
          button.removeAttribute("aria-busy");
        });
        busyButtons.clear();
      }
      previous = count;
    });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
      stop();
    };
  }, []);

  if (!busy) return null;
  return (
    <div className="screen-loader pointer-events-none fixed inset-0 z-[100] grid place-items-center" role="progressbar" aria-label="Loading">
      <div className="screen-loader-card flex flex-col items-center gap-3 rounded-2xl px-7 py-6">
        <span className="screen-loader-spin h-12 w-12 rounded-full border-4" />
        <span className="screen-loader-text text-sm font-semibold">Loading…</span>
      </div>
    </div>
  );
}

/** Suspense fallback that also drives the top bar while a lazy page chunk downloads. */
export function PendingMark({ children = null }) {
  useEffect(() => {
    setPending(1);
    return () => setPending(-1);
  }, []);
  return children;
}
