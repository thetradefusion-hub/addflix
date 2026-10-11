let deferredPrompt = null;
const listeners = new Set();

export function getInstallPrompt() {
  return deferredPrompt;
}

export function subscribeInstallPrompt(listener) {
  listeners.add(listener);
  if (deferredPrompt) listener(deferredPrompt);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    listeners.forEach((listener) => listener(event));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((listener) => listener(null));
  });
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  if (document.documentElement.classList.contains("pwa-app")) return true;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function deviceKind() {
  const ua = navigator.userAgent || "";
  const inApp = /FBAN|FBAV|Instagram|Line\/|Twitter|WhatsApp|Telegram|Snapchat/i.test(ua) || /; wv\)/.test(ua);
  const apple = /iphone|ipad|ipod/i.test(ua);
  return { inApp, apple, android: /android/i.test(ua) };
}

export async function runInstallPrompt() {
  const event = deferredPrompt;
  if (!event) return "unavailable";
  deferredPrompt = null;
  listeners.forEach((listener) => listener(null));
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice?.outcome === "accepted" ? "accepted" : "dismissed";
  } catch {
    return "unavailable";
  }
}
