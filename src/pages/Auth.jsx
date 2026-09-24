import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const defaultRegister = {
  fullName: '',
  mobile: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  sponsorId: 'ADD12568',
  otp: '',
  termsAccepted: false,
  privacyAccepted: false,
};

const defaultLogin = {
  login: '',
  password: '',
  otp: '',
  remember: true,
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [register, setRegister] = useState(defaultRegister);
  const [login, setLogin] = useState(defaultLogin);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);

  const isSubmitDisabled = useMemo(() => loading, [loading]);

  const setField = (stateSetter, key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    stateSetter((prev) => ({ ...prev, [key]: value }));
  };

  async function submitRegister(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(register),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('addflix_token', data.token);
      localStorage.setItem('addflix_user', JSON.stringify(data.user));
      setMessage('Registration successful. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      setMessage(error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('addflix_token', data.token);
      localStorage.setItem('addflix_user', JSON.stringify(data.user));
      setMessage('Login successful. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      setMessage(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: login.login }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password reset request failed');
      setMessage(data.message || 'Password reset request sent.');
      setResetMode(false);
    } catch (error) {
      setMessage(error.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#1f2937_35%,#7f1d1d)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm">
        <div className="grid md:grid-cols-2">
          <div className="hidden bg-[radial-gradient(circle_at_top,#e10600,#5b0210_60%,#0f172a)] p-8 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold">
                ADD FLIX
              </div>
              <h1 className="text-4xl font-black tracking-tight">Watch, Promote &amp; Earn</h1>
              <p className="mt-4 max-w-md text-sm text-white/80">
                Create your account, unlock ROI rewards, grow your referral team and manage secure wallet activity from one dashboard.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-white/80">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">• Full registration flow with OTP validation</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">• Secure login, password reset and 2FA support</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">• Referral-based onboarding and wallet security</div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#667085]">Welcome</p>
                <h2 className="text-2xl font-black text-[#101828]">{mode === 'login' ? 'Login' : 'Create account'}</h2>
              </div>
              <div className="flex gap-2 rounded-full bg-slate-100 p-1">
                <button type="button" onClick={() => setMode('login')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${mode === 'login' ? 'bg-[#e10600] text-white' : 'text-slate-600'}`}>
                  Login
                </button>
                <button type="button" onClick={() => setMode('register')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${mode === 'register' ? 'bg-[#e10600] text-white' : 'text-slate-600'}`}>
                  Register
                </button>
              </div>
            </div>

            {message ? <div className="mb-4 rounded-xl border border-[#f4d5d4] bg-[#fff1ef] px-3 py-2 text-sm text-[#7a1d17]">{message}</div> : null}

            {mode === 'login' && !resetMode ? (
              <form onSubmit={submitLogin} className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#475467]">Email / Mobile / Username</span>
                  <input value={login.login} onChange={setField(setLogin, 'login')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Enter your login ID" required />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#475467]">Password</span>
                  <input type="password" value={login.password} onChange={setField(setLogin, 'password')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Enter password" required />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#475467]">2FA OTP (optional, demo: 123456)</span>
                  <input value={login.otp} onChange={setField(setLogin, 'otp')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Enter OTP if enabled" />
                </label>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-[#475467]">
                    <input type="checkbox" checked={login.remember} onChange={setField(setLogin, 'remember')} className="h-4 w-4 rounded border-slate-300" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setResetMode(true)} className="font-semibold text-[#e10600]">Forgot Password?</button>
                </div>

                <button type="submit" disabled={isSubmitDisabled} className="h-12 w-full rounded-xl bg-[#e10600] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Signing in...' : 'Login'}
                </button>
              </form>
            ) : null}

            {resetMode ? (
              <form onSubmit={submitForgotPassword} className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#475467]">Email Address</span>
                  <input value={login.login} onChange={setField(setLogin, 'login')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Enter your email" required />
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={isSubmitDisabled} className="h-12 flex-1 rounded-xl bg-[#e10600] text-sm font-bold text-white disabled:opacity-60">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => setResetMode(false)} className="h-12 flex-1 rounded-xl border border-[#e4e7ec] bg-white text-sm font-semibold text-[#475467]">
                    Back to Login
                  </button>
                </div>
              </form>
            ) : null}

            {mode === 'register' ? (
              <form onSubmit={submitRegister} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">Full Name</span>
                    <input value={register.fullName} onChange={setField(setRegister, 'fullName')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Enter full name" required />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">Mobile Number</span>
                    <input value={register.mobile} onChange={setField(setRegister, 'mobile')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="+91 98765 43210" required />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">Email Address</span>
                    <input type="email" value={register.email} onChange={setField(setRegister, 'email')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="name@example.com" required />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">Username / User ID</span>
                    <input value={register.username} onChange={setField(setRegister, 'username')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="username123" required />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">Password</span>
                    <input type="password" value={register.password} onChange={setField(setRegister, 'password')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Password@123" required />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">Confirm Password</span>
                    <input type="password" value={register.confirmPassword} onChange={setField(setRegister, 'confirmPassword')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Repeat password" required />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">Sponsor / Referral ID</span>
                    <input value={register.sponsorId} onChange={setField(setRegister, 'sponsorId')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Enter referral ID" required />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-[#475467]">OTP Verification</span>
                    <input value={register.otp} onChange={setField(setRegister, 'otp')} className="h-12 w-full rounded-xl border border-[#e4e7ec] bg-[#f8fafc] px-3 text-sm outline-none focus:border-[#e10600]" placeholder="Demo OTP: 123456" required />
                  </label>
                </div>

                <div className="space-y-2 text-sm text-[#475467]">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" checked={register.termsAccepted} onChange={setField(setRegister, 'termsAccepted')} className="mt-1 h-4 w-4 rounded border-slate-300" required />
                    <span>I accept the Terms &amp; Conditions.</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" checked={register.privacyAccepted} onChange={setField(setRegister, 'privacyAccepted')} className="mt-1 h-4 w-4 rounded border-slate-300" required />
                    <span>I accept the Privacy Policy.</span>
                  </label>
                </div>

                <button type="submit" disabled={isSubmitDisabled} className="h-12 w-full rounded-xl bg-[#e10600] text-sm font-bold text-white disabled:opacity-60">
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            ) : null}

            <div className="mt-5 text-center text-xs text-[#667085]">
              Demo login credentials: <span className="font-bold text-[#101828]">rahul123 / Password@123</span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#eaecf0] pt-4 text-xs text-[#667085]">
              <span>Need help?</span>
              <Link to="/legal/privacy" className="font-semibold text-[#e10600]">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
