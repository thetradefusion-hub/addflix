import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useApp } from '@/context/AppContext';
import { deviceId } from '@/lib/device';
import { REFERRAL_ID, emailError, mobileError, normalizeReferralId } from '../../shared/contact.js';

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

function Field({ label, required, hint, hintTone, error, children }) {
  const tone = error
    ? 'mt-1.5 block text-[12px] font-medium leading-4 text-red-600'
    : hintTone === 'ok'
      ? 'mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold leading-4 text-emerald-700'
      : 'mt-1.5 block text-[12px] font-medium leading-4 text-[#667085]';
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#344054]">
        {label}
        {required ? <span className="text-[#e10600]"> *</span> : null}
      </span>
      {children}
      {error ? <span className={tone}>{error}</span> : hint ? (
        <span className={tone}>
          {hintTone === 'ok' ? <CheckCircle2 size={14} /> : null}
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function PasswordInput({ value, onChange, onBlur, autoComplete, required, className = '' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className={`${inputClass} pr-11 ${className}`}
        autoComplete={autoComplete}
        required={required}
        onBlur={onBlur}
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

export default function AuthPage({ mode: routeMode = 'login' }) {
  const [searchParams] = useSearchParams();
  if (routeMode === 'login' && searchParams.get('join') === '1') return <Navigate to="/register" replace />;
  return <AuthScreen routeMode={routeMode} />;
}

function AuthScreen({ routeMode }) {
  const navigate = useNavigate();
  const { code } = useParams();
  const sponsorCode = String(code || '').trim().toUpperCase();
  const { startSession } = useApp();
  const mode = sponsorCode ? 'register' : routeMode;
  const [register, setRegister] = useState({ ...defaultRegister, sponsorId: sponsorCode });
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorStatus, setSponsorStatus] = useState('idle');
  const [formErrors, setFormErrors] = useState({});
  const [login, setLogin] = useState(defaultLogin);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const sponsorSeq = useRef(0);

  useEffect(() => {
    if (!sponsorCode) return;
    setRegister((prev) => ({ ...prev, sponsorId: sponsorCode }));
  }, [sponsorCode]);

  useEffect(() => {
    if (mode !== 'register') return undefined;
    const code = normalizeReferralId(register.sponsorId);
    if (!code) {
      setSponsorName('');
      setSponsorStatus('idle');
      return undefined;
    }
    if (!REFERRAL_ID.test(code)) {
      setSponsorName('');
      setSponsorStatus(code.length >= 4 ? 'invalid' : 'idle');
      return undefined;
    }
    const seq = ++sponsorSeq.current;
    setSponsorStatus('looking');
    const timer = setTimeout(() => {
      apiFetch(`/api/auth/sponsor/${encodeURIComponent(code)}`)
        .then((data) => {
          if (seq !== sponsorSeq.current) return;
          setSponsorName(data.sponsor?.name || '');
          setSponsorStatus('found');
        })
        .catch(() => {
          if (seq !== sponsorSeq.current) return;
          setSponsorName('');
          setSponsorStatus('missing');
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [mode, register.sponsorId]);

  const isSubmitDisabled = useMemo(() => loading, [loading]);

  const setField = (stateSetter, key) => (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (key === 'sponsorId') value = String(value).toUpperCase().replace(/\s+/g, '');
    if (key === 'mobile') value = String(value).replace(/[^\d+\s()-]/g, '');
    if (key === 'email') value = String(value).replace(/\s+/g, '');
    stateSetter((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({
      ...prev,
      [key]: '',
      ...(key === 'termsAccepted' || key === 'privacyAccepted' ? { terms: '' } : {}),
    }));
  };

  const checkRegister = (values = register, status = sponsorStatus) => {
    const errors = {};
    const sponsor = normalizeReferralId(values.sponsorId);
    if (!sponsor) errors.sponsorId = 'Referral ID is required.';
    else if (!REFERRAL_ID.test(sponsor)) errors.sponsorId = 'Enter a valid referral ID.';
    else if (status === 'missing') errors.sponsorId = 'This referral ID was not found.';
    else if (status !== 'found') errors.sponsorId = 'Referral ID could not be verified. Check it and try again.';
    if (String(values.fullName).trim().length < 2) errors.fullName = 'Enter your full name.';
    const badMobile = mobileError(values.mobile);
    if (badMobile) errors.mobile = badMobile;
    const badEmail = emailError(values.email);
    if (badEmail) errors.email = badEmail;
    if (String(values.username).trim().length < 3) errors.username = 'Username must be at least 3 characters.';
    if (!values.password) errors.password = 'Password is required.';
    else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!values.confirmPassword) errors.confirmPassword = 'Confirm your password.';
    else     if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!values.termsAccepted || !values.privacyAccepted) errors.terms = 'Accept the Terms and Privacy Policy to continue.';
    return errors;
  };

  const blurRegister = (key) => {
    const errors = checkRegister();
    setFormErrors((prev) => ({ ...prev, [key]: errors[key] || '' }));
  };

  async function submitRegister(event) {
    event.preventDefault();
    const nextErrors = checkRegister();
    setFormErrors(nextErrors);
    const first = Object.values(nextErrors).find(Boolean);
    if (first) {
      setMessage(first);
      return;
    }
    setRegister((prev) => ({ ...prev, otp: '' }));
    setFormErrors((prev) => ({ ...prev, otp: '' }));
    setOtpNotice('');
    setMessage('');
    setOtpStep(true);
  }

  async function submitOtp(event) {
    event.preventDefault();
    const otp = String(register.otp).trim();
    if (!/^\d{6}$/.test(otp)) {
      setFormErrors((prev) => ({ ...prev, otp: 'Enter the 6-digit OTP.' }));
      setMessage('Enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(register),
      });

      startSession(data.token, data.user).catch(() => {});
      setMessage('Registration successful. Redirecting...');
      navigate('/dashboard');
    } catch (error) {
      const text = error.message || 'Registration failed.';
      if (/otp/i.test(text)) setFormErrors((prev) => ({ ...prev, otp: text }));
      setMessage(text);
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

      startSession(data.token, data.user).catch(() => {});
      setMessage('Login successful. Redirecting...');
      navigate('/dashboard');
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

  const heading = otpStep ? 'Verify your email' : resetMode ? 'Reset password' : mode === 'login' ? 'Sign in' : 'Create account';
  const subheading = otpStep
    ? `An OTP was sent to ${register.email}. Enter it to finish creating your account.`
    : resetMode
      ? 'Enter the email on your account. We will send a reset link.'
      : mode === 'login'
        ? 'Use your email, mobile, or username.'
        : 'A few details, then your account is ready.';

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden overflow-y-auto bg-[#f4f6f8] px-4 py-8 text-[#101828]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(225,6,0,0.18),transparent_70%)]" />
      <div className="fixed inset-x-4 top-4 z-20 flex items-center justify-between">
        <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#eaecf0] bg-white px-3 text-sm font-semibold text-[#344054] shadow-sm hover:text-[#e10600]">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <ThemeToggle />
      </div>
      <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center pt-12">
        <Logo light={false} className="h-24" />
        <section className="mt-7 w-full rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.08)] sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="mt-1 text-sm text-[#667085]">{subheading}</p>

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

        {otpStep ? (
          <form onSubmit={submitOtp} className="mt-6 space-y-4" noValidate>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
              Check <span className="font-semibold">{register.email}</span> for a 6-digit OTP, then enter it below.
            </div>
            <Field label="OTP" required error={formErrors.otp}>
              <input
                value={register.otp}
                onChange={setField(setRegister, 'otp')}
                className={`${inputClass} tracking-[0.3em] ${formErrors.otp ? 'border-red-500' : ''}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                autoFocus
                required
              />
            </Field>
            {otpNotice ? <p className="text-sm font-medium text-emerald-700">{otpNotice}</p> : null}
            <button type="submit" disabled={isSubmitDisabled} className={submitClass}>
              {loading ? 'Verifying...' : 'Submit OTP'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpNotice('A new OTP was sent to your email.');
                setRegister((prev) => ({ ...prev, otp: '' }));
                setFormErrors((prev) => ({ ...prev, otp: '' }));
                setMessage('');
              }}
              className="h-11 w-full rounded-lg text-sm font-semibold text-[#e10600]"
            >
              Resend OTP
            </button>
            <button
              type="button"
              onClick={() => { setOtpStep(false); setMessage(''); setOtpNotice(''); }}
              className="h-11 w-full rounded-lg text-sm font-medium text-[#475467]"
            >
              Edit details
            </button>
          </form>
        ) : null}

        {mode === 'register' && !resetMode && !otpStep ? (
          <form onSubmit={submitRegister} className="mt-6 space-y-4" noValidate>
            <Field
              label="Referral ID / Sponsor ID"
              required
              error={formErrors.sponsorId || (sponsorStatus === 'missing' ? 'This referral ID was not found.' : sponsorStatus === 'invalid' ? 'Enter a valid referral ID.' : '')}
              hint={sponsorStatus === 'found' ? `Verified sponsor: ${sponsorName}` : sponsorStatus === 'looking' ? 'Checking…' : ''}
              hintTone={sponsorStatus === 'found' ? 'ok' : undefined}
            >
              <input
                value={register.sponsorId}
                onChange={setField(setRegister, 'sponsorId')}
                readOnly={Boolean(sponsorCode)}
                className={`${inputClass} uppercase read-only:bg-[#f2f4f7] read-only:text-[#475467] ${sponsorStatus === 'found' ? 'border-emerald-600 focus:border-emerald-600 focus:ring-emerald-600/15' : sponsorStatus === 'missing' || sponsorStatus === 'invalid' || formErrors.sponsorId ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter referral ID"
                autoComplete="off"
                required
              />
            </Field>
            <Field label="Full name" required error={formErrors.fullName}>
              <input value={register.fullName} onChange={setField(setRegister, 'fullName')} onBlur={() => blurRegister('fullName')} className={`${inputClass} ${formErrors.fullName ? 'border-red-500' : ''}`} autoComplete="name" required />
            </Field>
            <Field label="Mobile" required error={formErrors.mobile}>
              <input
                value={register.mobile}
                onChange={setField(setRegister, 'mobile')}
                onBlur={() => blurRegister('mobile')}
                className={`${inputClass} ${formErrors.mobile ? 'border-red-500' : ''}`}
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </Field>
            <Field label="Email" required error={formErrors.email}>
              <input
                type="email"
                value={register.email}
                onChange={setField(setRegister, 'email')}
                onBlur={() => blurRegister('email')}
                className={`${inputClass} ${formErrors.email ? 'border-red-500' : ''}`}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Username" required error={formErrors.username}>
              <input value={register.username} onChange={setField(setRegister, 'username')} onBlur={() => blurRegister('username')} className={`${inputClass} ${formErrors.username ? 'border-red-500' : ''}`} autoComplete="username" required />
            </Field>
            <Field label="Password" required error={formErrors.password}>
              <PasswordInput value={register.password} onChange={setField(setRegister, 'password')} onBlur={() => blurRegister('password')} autoComplete="new-password" required className={formErrors.password ? 'border-red-500' : ''} />
            </Field>
            <Field label="Confirm password" required error={formErrors.confirmPassword}>
              <PasswordInput value={register.confirmPassword} onChange={setField(setRegister, 'confirmPassword')} onBlur={() => blurRegister('confirmPassword')} autoComplete="new-password" required className={formErrors.confirmPassword ? 'border-red-500' : ''} />
            </Field>
            <div className="space-y-2.5 pt-1 text-sm text-[#475467]">
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={register.termsAccepted} onChange={setField(setRegister, 'termsAccepted')} className="mt-0.5 h-4 w-4 rounded border-slate-300" required />
                <span>I accept the <Link to="/legal/terms" className="font-medium text-[#e10600]">Terms</Link> <span className="text-[#e10600]">*</span></span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={register.privacyAccepted} onChange={setField(setRegister, 'privacyAccepted')} className="mt-0.5 h-4 w-4 rounded border-slate-300" required />
                <span>I accept the <Link to="/legal/privacy" className="font-medium text-[#e10600]">Privacy Policy</Link> <span className="text-[#e10600]">*</span></span>
              </label>
              {formErrors.terms ? <p className="text-[12px] font-medium text-red-600">{formErrors.terms}</p> : null}
            </div>
            <button type="submit" disabled={isSubmitDisabled} className={submitClass}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        ) : null}

        {resetMode || otpStep ? null : (
          <p className="mt-5 border-t border-[#eaecf0] pt-4 text-center text-sm text-[#667085]">
            {mode === 'login' ? (
              <>Don&apos;t have an account? <Link to="/register" className="font-semibold text-[#e10600]">Create account</Link></>
            ) : (
              <>Already have an account? <Link to="/auth" className="font-semibold text-[#e10600]">Sign in</Link></>
            )}
          </p>
        )}
        </section>
      </main>
    </div>
  );
}
