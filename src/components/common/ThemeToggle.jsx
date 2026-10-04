import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "addflix_theme";

export function readTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useThemeDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("addflix-theme", sync);
    return () => window.removeEventListener("addflix-theme", sync);
  }, []);
  return dark;
}

export function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(KEY, dark ? "dark" : "light");
  window.dispatchEvent(new Event("addflix-theme"));
}

export default function ThemeToggle({ tone = "ink" }) {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const sync = () => setTheme(readTheme());
    window.addEventListener("addflix-theme", sync);
    return () => window.removeEventListener("addflix-theme", sync);
  }, []);
  const next = theme === "dark" ? "light" : "dark";
  const color = tone === "light" ? "text-white hover:bg-white/10" : "text-[#111] hover:bg-black/5";
  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
      className={`grid h-10 w-10 place-items-center rounded-full ${color}`}
      onClick={() => applyTheme(next)}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
