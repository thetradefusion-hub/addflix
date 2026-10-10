import { useEffect, useState } from "react";

const DISMISS_KEY = "addflix_install_dismissed";

function alreadyInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function appleDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [promptEvent, setPromptEvent] = useState(null);
  const [help, setHelp] = useState("");

  useEffect(() => {
    if (alreadyInstalled() || sessionStorage.getItem(DISMISS_KEY) === "1") return undefined;
    const onPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
      setOpen(true);
    };
    const onInstalled = () => {
      sessionStorage.setItem(DISMISS_KEY, "1");
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  if (!open) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (!promptEvent) {
      setHelp(appleDevice()
        ? "Tap the Share button, then Add to Home Screen."
        : "Open the browser menu and choose Install app.");
      return;
    }
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") dismiss();
  };

  return (
    <div className="install-banner theme-fixed pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-[80] lg:inset-x-auto lg:bottom-5 lg:right-5 lg:w-[22.5rem]">
      <div className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#12141b] p-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]" role="dialog" aria-label="Install ADD FLIX">
        <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install ADD FLIX</p>
          <p className="mt-0.5 text-xs leading-5 text-white/70">{help || "Add the app for a faster, full-screen experience."}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button type="button" onClick={install} className="h-9 rounded-lg bg-[#e10600] px-3 text-xs font-bold text-white">Install</button>
          <button type="button" onClick={dismiss} className="h-8 rounded-lg px-3 text-xs font-semibold text-white/70">Not now</button>
        </div>
      </div>
    </div>
  );
}
