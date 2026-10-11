import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import InstallPrompt from "./components/pwa/InstallPrompt";
import { AppProvider } from "./context/AppContext";
import "./lib/pwaInstall";
import "./index.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

const splash = document.getElementById("pwa-splash");
if (splash && !document.documentElement.classList.contains("pwa-app")) {
  splash.remove();
} else if (splash) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => {
    splash.classList.add("is-done");
    window.setTimeout(() => splash.remove(), 420);
  }, reduced ? 280 : 1650);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <InstallPrompt />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
