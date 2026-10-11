import { useEffect, useState } from "react";
import { deviceKind, getInstallPrompt, runInstallPrompt, subscribeInstallPrompt } from "@/lib/pwaInstall";

const DISMISS_KEY = "addflix_install_dismissed";

function alreadyInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function stepsFor(kind) {
  if (kind.inApp) {
    return [
      "This browser cannot install apps.",
      "Open the page menu and choose Open in Chrome, or Open in Safari.",
      "Then tap Install on this banner again.",
    ];
  }
  if (kind.apple) {
    return [
      "Tap the Share button in Safari (the square with an arrow).",
      "Scroll down and tap Add to Home Screen.",
      "Tap Add. The ADD FLIX icon will appear on your home screen.",
    ];
  }
  return [
      "Tap the three-dot menu in the corner of the browser.",
    "Tap Install app, or Add to Home screen.",
    "Confirm Add. ADD FLIX will open like an app.",
  ];
}

export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(() => Boolean(getInstallPrompt()));
  const [guide, setGuide] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (alreadyInstalled() || sessionStorage.getItem(DISMISS_KEY) === "1") return undefined;
    const timer = window.setTimeout(() => setOpen(true), 900);
    const unsubscribe = subscribeInstallPrompt((event) => setReady(Boolean(event)));
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  if (!open) return null;

  const kind = deviceKind();
  const steps = stepsFor(kind);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (!getInstallPrompt()) {
      setGuide(true);
      return;
    }
    setBusy(true);
    const result = await runInstallPrompt();
    setBusy(false);
    setReady(false);
    if (result === "accepted") dismiss();
    else setGuide(true);
  };

  const chromeUrl = kind.android && kind.inApp
    ? `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`
    : "";

  return (
    <div className="install-banner theme-fixed fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-[80] lg:inset-x-auto lg:bottom-5 lg:right-5 lg:w-[22.5rem]">
      <div className="rounded-2xl border border-white/10 bg-[#12141b] p-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]" role="dialog" aria-label="Install ADD FLIX">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Install ADD FLIX</p>
            <p className="mt-0.5 text-xs leading-5 text-white/70">Add the app to your home screen.</p>
          </div>
          <button type="button" onClick={dismiss} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lg leading-none text-white/70" aria-label="Not now">×</button>
        </div>
        <button
          type="button"
          onClick={install}
          disabled={busy}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-[#e10600] text-sm font-bold text-white disabled:opacity-70"
        >
          {busy ? "Opening installer…" : "Install"}
        </button>
        {guide ? (
          <ol className="mt-3 space-y-2 rounded-xl bg-white/5 p-3 text-sm leading-5 text-white/85">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="font-bold text-[#ff8a84]">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
            {chromeUrl ? (
              <li className="pt-1">
                <a href={chromeUrl} className="inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-bold text-[#111]">Open in Chrome</a>
              </li>
            ) : null}
          </ol>
        ) : null}
        {ready ? null : guide ? null : (
          <p className="mt-2 text-center text-[11px] text-white/45">Tap Install for the steps on this phone.</p>
        )}
      </div>
    </div>
  );
}
