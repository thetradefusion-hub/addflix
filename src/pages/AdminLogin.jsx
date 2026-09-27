import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/layout/Logo";
import { saveAdminSession } from "@/lib/api";
import { deviceId } from "@/lib/device";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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
    <div className="flex min-h-screen items-center justify-center bg-[#0c0e13] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141820] p-6 text-white shadow-2xl sm:p-8">
        <Logo />
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#e10600]">Admin</p>
        <h1 className="mt-2 text-2xl font-black">Sign in</h1>
        <p className="mt-2 text-sm text-white/60">This page is only for the ADD FLIX admin account.</p>

        {message ? <p className="mt-4 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{message}</p> : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/70">Email or username</span>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0c0e13] px-3 text-sm text-white outline-none focus:border-[#e10600]"
              placeholder="admin@addflix.demo"
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/70">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0c0e13] px-3 text-sm text-white outline-none focus:border-[#e10600]"
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-[#e10600] text-sm font-bold text-white disabled:opacity-60">
            {loading ? "Signing in..." : "Admin sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/45">
          Member accounts use the{" "}
          <Link to="/auth" className="font-semibold text-white/80 underline">member login</Link>.
        </p>
      </div>
    </div>
  );
}
