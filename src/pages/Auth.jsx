import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useApp } from '@/context/AppContext';
import { deviceId } from '@/lib/device';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function apiFetch(path, options = {}) {
  const url = `${API_BASE || ''}${path}`;
  const response = await fetch(url, options);
  const text = await response.text();

  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: 'Server returned an invalid response.' };
    }
  }

  if (!response.ok) {
    const details = Array.isArray(data.errors) ? data.errors.filter(Boolean) : [];
    throw new Error(details.length ? details.join(' ') : (data.message || `Request failed with status ${response.status}`));
  }

  return data;
}

const defaultRegister = {
  fullName: '',
  mobile: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  sponsorId: '',
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

const inputClass = 'h-11 w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#e10600] focus:ring-4 focus:ring-[#e10600]/10';
const submitClass = 'h-11 w-full rounded-xl bg-[#e10600] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(225,6,0,0.28)] disabled:cursor-not-allowed disabled:opacity-60';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#344054]">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] leading-4 text-[#98a2b3]">{hint}</span> : null}
    </label>
  );
}

function PasswordInput({ value, onChange, autoComplete, required }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className={`${inputClass} pr-11`}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisible((open) => !open)}
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#667085] hover:text-[#101828]"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const sponsorCode = String(code || '').trim().toUpperCase();
  const { refreshSession } = useApp();
  const [mode, setMode] = useState(sponsorCode || searchParams.get('join') === '1' ? 'register' : 'login');
  const [register, setRegister] = useState({ ...defaultRegister, sponsorId: sponsorCode });
  const [sponsorName, setSponsorName] = useState('');
  const [login, setLogin] = useState(defaultLogin);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    if (!sponsorCode) return;
    setMode('register');
    setRegister((prev) => ({ ...prev, sponsorId: sponsorCode }));
    apiFetch(`/api/auth/sponsor/${encodeURIComponent(sponsorCode)}`)
      .then((data) => setSponsorName(data.sponsor?.name || ''))
      .catch((error) => {
        setSponsorName('');
        setMessage(error.message);
      });
  }, [sponsorCode]);

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
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(register),
      });

      localStorage.setItem('addflix_token', data.token);
      localStorage.setItem('addflix_user', JSON.stringify(data.user));
      localStorage.removeItem('addflix_impersonating');
      await refreshSession();
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
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...login, portal: 'member', deviceId: deviceId() }),
      });

      localStorage.setItem('addflix_token', data.token);
      localStorage.setItem('addflix_user', JSON.stringify(data.user));
      localStorage.removeItem('addflix_impersonating');
      await refreshSession();
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
      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: login.login }),
      });
      setMessage(data.message || 'Password reset request sent.');
      setResetMode(false);
    } catch (error) {
      setMessage(error.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  }

  const heading = resetMode ? 'Reset password' : mode === 'login' ? 'Sign in' : 'Create account';
  const subheading = resetMode
    ? 'Enter the email on your account. We will send a reset link.'
    : mode === 'login'
      ? 'Use your email, mobile, or username.'
      : 'A few details, then your account is ready.';

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f4f6f8] px-4 py-8 text-[#101828]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(225,6,0,0.18),transparent_70%)]" />
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center">
        <Logo light={false} className="h-24" />
        <section className="mt-7 w-full rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.08)] sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="mt-1 text-sm text-[#667085]">{subheading}</p>

        {resetMode ? null : (
          <div className="mt-5 grid grid-cols-2 rounded-xl bg-[#f4f6f8] p-1 text-sm font-medium">
            <button type="button" onClick={() => { setMode('login'); setMessage(''); }} className={`h-9 rounded-lg ${mode === 'login' ? 'bg-white text-[#101828] shadow-sm' : 'text-[#667085]'}`}>
              Sign in
            </button>
            <button type="button" onClick={() => { setMode('register'); setResetMode(false); setMessage(''); }} className={`h-9 rounded-lg ${mode === 'register' ? 'bg-white text-[#101828] shadow-sm' : 'text-[#667085]'}`}>
              Create account
            </button>
          </div>
        )}

        {message ? <div className="mt-5 rounded-lg border border-[#f4d5d4] bg-[#fff1ef] px-3 py-2 text-sm text-[#7a1d17]">{message}</div> : null}

        {mode === 'login' && !resetMode ? (
          <form onSubmit={submitLogin} className="mt-5 space-y-3.5">
            <Field label="Email, mobile, or username">
              <input value={login.login} onChange={setField(setLogin, 'login')} className={inputClass} autoComplete="username" required />
            </Field>
            <Field label="Password">
              <PasswordInput value={login.password} onChange={setField(setLogin, 'password')} autoComplete="current-password" required />
            </Field>
            {showOtp ? (
              <Field label="2FA code">
                <input value={login.otp} onChange={setField(setLogin, 'otp')} className={inputClass} inputMode="numeric" autoComplete="one-time-code" />
              </Field>
            ) : (
              <button type="button" onClick={() => setShowOtp(true)} className="text-sm font-medium text-[#667085]">Have a 2FA code?</button>
            )}
            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-[#475467]">
                <input type="checkbox" checked={login.remember} onChange={setField(setLogin, 'remember')} className="h-4 w-4 rounded border-slate-300" />
                Remember me
              </label>
              <button type="button" onClick={() => { setResetMode(true); setMessage(''); }} className="font-medium text-[#e10600]">Forgot password</button>
            </div>
            <button type="submit" disabled={isSubmitDisabled} className={submitClass}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : null}

        {resetMode ? (
          <form onSubmit={submitForgotPassword} className="mt-6 space-y-4">
            <Field label="Email">
              <input type="email" value={login.login} onChange={setField(setLogin, 'login')} className={inputClass} autoComplete="email" required />
            </Field>
            <button type="submit" disabled={isSubmitDisabled} className={submitClass}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <button type="button" onClick={() => { setResetMode(false); setMessage(''); }} className="h-11 w-full rounded-lg text-sm font-medium text-[#475467]">
              Back to sign in
            </button>
          </form>
        ) : null}

        {mode === 'register' && !resetMode ? (
          <form onSubmit={submitRegister} className="mt-6 space-y-4">
            <Field label="Full name">
              <input value={register.fullName} onChange={setField(setRegister, 'fullName')} className={inputClass} autoComplete="name" required />
            </Field>
            <Field label="Mobile">
              <input value={register.mobile} onChange={setField(setRegister, 'mobile')} className={inputClass} autoComplete="tel" required />
            </Field>
            <Field label="Email">
              <input type="email" value={register.email} onChange={setField(setRegister, 'email')} className={inputClass} autoComplete="email" required />
            </Field>
            <Field label="Username">
              <input value={register.username} onChange={setField(setRegister, 'username')} className={inputClass} autoComplete="username" required />
            </Field>
            <Field label="Password" hint="8 or more characters, with a capital letter, a number, and a symbol.">
              <PasswordInput value={register.password} onChange={setField(setRegister, 'password')} autoComplete="new-password" required />
            </Field>
            <Field label="Confirm password">
              <PasswordInput value={register.confirmPassword} onChange={setField(setRegister, 'confirmPassword')} autoComplete="new-password" required />
            </Field>
            <Field label="Referral ID" hint={sponsorName ? `Sponsor: ${sponsorName}` : null}>
              <input value={register.sponsorId} onChange={setField(setRegister, 'sponsorId')} readOnly={Boolean(sponsorCode)} className={`${inputClass} read-only:text-[#475467]`} required />
            </Field>
            <Field label="OTP">
              <input value={register.otp} onChange={setField(setRegister, 'otp')} className={inputClass} inputMode="numeric" autoComplete="one-time-code" required />
            </Field>
            <div className="space-y-2.5 pt-1 text-sm text-[#475467]">
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={register.termsAccepted} onChange={setField(setRegister, 'termsAccepted')} className="mt-0.5 h-4 w-4 rounded border-slate-300" required />
                <span>I accept the <Link to="/legal/terms" className="font-medium text-[#e10600]">Terms</Link>.</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={register.privacyAccepted} onChange={setField(setRegister, 'privacyAccepted')} className="mt-0.5 h-4 w-4 rounded border-slate-300" required />
                <span>I accept the <Link to="/legal/privacy" className="font-medium text-[#e10600]">Privacy Policy</Link>.</span>
              </label>
            </div>
            <button type="submit" disabled={isSubmitDisabled} className={submitClass}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        ) : null}
        </section>
      </main>
    </div>
  );
}
