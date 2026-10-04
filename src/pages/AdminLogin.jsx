import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/layout/Logo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { saveAdminSession } from "@/lib/api";
import { deviceId } from "@/lib/device";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const inputClass = "h-11 w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#e10600] focus:ring-4 focus:ring-[#e10600]/10";

function PasswordInput({ value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={`${inputClass} pr-11`}
        autoComplete="current-password"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((open) => !open)}
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#667085] hover:text-[#101828]"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function AdminLogin({ onSuccess }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password, portal: "admin", deviceId: deviceId() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Admin sign-in failed.");
      if (data.user?.role !== "admin" || !data.token) {
        throw new Error("This sign-in is for admin accounts only.");
      }
      saveAdminSession(data.token, data.user);
      onSuccess();
    } catch (error) {
      setMessage(error.message || "Admin sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f4f6f8] px-4 py-8 text-[#101828]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(225,6,0,0.18),transparent_70%)]" />
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center">
        <Logo light={false} className="h-24" />
        <section className="mt-7 w-full rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.08)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e10600]">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-[#667085]">This page is only for the ADD FLIX admin account.</p>
          {message ? <div className="mt-5 rounded-lg border border-[#f4d5d4] bg-[#fff1ef] px-3 py-2 text-sm text-[#7a1d17]">{message}</div> : null}
          <form onSubmit={submit} className="mt-5 space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-[#344054]">Email or username</span>
              <input value={login} onChange={(event) => setLogin(event.target.value)} className={inputClass} autoComplete="username" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-[#344054]">Password</span>
              <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-[#e10600] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(225,6,0,0.28)] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Signing in..." : "Admin sign in"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-[#667085]">
            Member accounts use the <Link to="/auth" className="font-medium text-[#e10600]">member login</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
