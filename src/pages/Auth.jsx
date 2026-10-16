import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useApp } from '@/context/AppContext';
import { deviceId } from '@/lib/device';
import { isStandalone } from '@/lib/pwaInstall';
import { REFERRAL_ID, emailError, mobileError, normalizeReferralId } from '../../shared/contact.js';
import { COUNTRIES } from '../../shared/countries.js';

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
  country: '',
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
  const [signupBonus, setSignupBonus] = useState(0);
  const [resetMode, setResetMode] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const sponsorSeq = useRef(0);
  const [avail, setAvail] = useState({
    mobile: { status: 'idle', message: '' },
    email: { status: 'idle', message: '' },
    username: { status: 'idle', message: '' },
  });
  const availSeq = useRef({ mobile: 0, email: 0, username: 0 });

  useEffect(() => {
    if (!sponsorCode) return;
    setRegister((prev) => ({ ...prev, sponsorId: sponsorCode }));
  }, [sponsorCode]);

  useEffect(() => {
    if (mode !== 'register') return undefined;
    let live = true;
    apiFetch('/api/platform')
      .then((data) => {
        if (live) setSignupBonus(Number(data.signupBonus) || 0);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [mode]);

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

  useEffect(() => {
    if (mode !== 'register') return undefined;

    const watch = [
      { key: 'mobile', value: register.mobile, ready: Boolean(String(register.mobile).trim()) && !mobileError(register.mobile) },
      { key: 'email', value: register.email, ready: Boolean(String(register.email).trim()) && !emailError(register.email) },
      { key: 'username', value: register.username, ready: String(register.username).trim().length >= 3 },
    ];

    const timers = watch.map(({ key, value, ready }) => {
      const trimmed = String(value ?? '').trim();
      if (!trimmed || !ready) {
        availSeq.current[key] += 1;
        setAvail((prev) => (prev[key].status === 'idle' && !prev[key].message ? prev : { ...prev, [key]: { status: 'idle', message: '' } }));
        return undefined;
      }
      const seq = ++availSeq.current[key];
      setAvail((prev) => ({ ...prev, [key]: { status: 'checking', message: '' } }));
      return setTimeout(() => {
        apiFetch(`/api/auth/availability?field=${encodeURIComponent(key)}&value=${encodeURIComponent(trimmed)}`)
          .then((data) => {
            if (seq !== availSeq.current[key]) return;
            if (data.available) {
              setAvail((prev) => ({ ...prev, [key]: { status: 'available', message: '' } }));
              setFormErrors((prev) => ({ ...prev, [key]: '' }));
              return;
            }
            const msg = data.message || `This ${key} is already registered.`;
            setAvail((prev) => ({ ...prev, [key]: { status: 'taken', message: msg } }));
            setFormErrors((prev) => ({ ...prev, [key]: msg }));
          })
          .catch((error) => {
            if (seq !== availSeq.current[key]) return;
            const msg = error.message || `Unable to check this ${key}.`;
            if (/already registered/i.test(msg)) {
              setAvail((prev) => ({ ...prev, [key]: { status: 'taken', message: msg } }));
              setFormErrors((prev) => ({ ...prev, [key]: msg }));
              return;
            }
            setAvail((prev) => ({ ...prev, [key]: { status: 'idle', message: '' } }));
          });
      }, 400);
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [mode, register.mobile, register.email, register.username]);

  const isSubmitDisabled = useMemo(() => {
    if (loading) return true;
    if (mode !== 'register' || otpStep) return false;
    return ['mobile', 'email', 'username'].some((key) => {
      const status = avail[key].status;
      return status === 'checking' || status === 'taken';
    });
  }, [loading, mode, otpStep, avail]);

  const setField = (stateSetter, key) => (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (key === 'sponsorId') value = String(value).toUpperCase().replace(/\s+/g, '');
    if (key === 'mobile') value = String(value).replace(/[^\d+\s()-]/g, '');
    if (key === 'email') value = String(value).replace(/\s+/g, '');
    if (key === 'termsAccepted') {
      const checked = Boolean(value);
      stateSetter((prev) => ({ ...prev, termsAccepted: checked, privacyAccepted: checked }));
      setFormErrors((prev) => ({ ...prev, terms: '' }));
      return;
    }
    stateSetter((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({
      ...prev,
      [key]: '',
      ...(key === 'termsAccepted' || key === 'privacyAccepted' ? { terms: '' } : {}),
    }));
  };

  const checkRegister = (values = register, status = sponsorStatus, availability = avail) => {
    const errors = {};
    const sponsor = normalizeReferralId(values.sponsorId);
    if (!sponsor) errors.sponsorId = 'Referral ID is required.';
    else if (!REFERRAL_ID.test(sponsor)) errors.sponsorId = 'Enter a valid referral ID.';
    else if (status === 'missing') errors.sponsorId = 'This referral ID was not found.';
    else if (status !== 'found') errors.sponsorId = 'Referral ID could not be verified. Check it and try again.';
    if (String(values.fullName).trim().length < 2) errors.fullName = 'Enter your full name.';
    if (!COUNTRIES.includes(values.country)) errors.country = 'Select your country.';
    const badMobile = mobileError(values.mobile);
    if (badMobile) errors.mobile = badMobile;
    else if (availability.mobile.status === 'taken') errors.mobile = availability.mobile.message || 'This mobile number is already registered.';
    else if (availability.mobile.status === 'checking') errors.mobile = 'Checking mobile availability…';
    const badEmail = emailError(values.email);
    if (badEmail) errors.email = badEmail;
    else if (availability.email.status === 'taken') errors.email = availability.email.message || 'This email is already registered.';
    else if (availability.email.status === 'checking') errors.email = 'Checking email availability…';
    if (String(values.username).trim().length < 3) errors.username = 'Username must be at least 3 characters.';
    else if (availability.username.status === 'taken') errors.username = availability.username.message || 'This username is already registered.';
    else if (availability.username.status === 'checking') errors.username = 'Checking username availability…';
    if (!values.password) errors.password = 'Password is required.';
    else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!values.confirmPassword) errors.confirmPassword = 'Confirm your password.';
    else if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
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
      setMessage(data.message || 'Registration successful. Redirecting...');
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
        {isStandalone() ? <span /> : (
          <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#eaecf0] bg-white px-3 text-sm font-semibold text-[#344054] shadow-sm hover:text-[#e10600]">
            <ArrowLeft size={16} /> Back to home
          </Link>
        )}
        <ThemeToggle />
      </div>
      <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center pt-12">
        <Logo light={false} className="h-24" />
        <section className="mt-7 w-full rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.08)] sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        {mode === 'register' && !otpStep && !resetMode && signupBonus > 0 ? (
          <p className="signup-bonus theme-fixed mt-3 rounded-xl px-3 py-2.5 text-center text-sm font-semibold tracking-tight text-white">
            Join and get ${signupBonus.toFixed(2)} instantly
          </p>
        ) : (
          <p className="mt-1 text-sm text-[#667085]">{subheading}</p>
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
                className={`${inputClass} uppercase ${sponsorCode ? 'bg-[#f2f4f7] text-[#101828]' : ''} ${sponsorStatus === 'found' ? 'border-emerald-600 focus:border-emerald-600 focus:ring-emerald-600/15' : sponsorStatus === 'missing' || sponsorStatus === 'invalid' || formErrors.sponsorId ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter referral ID"
                autoComplete="off"
                required
              />
            </Field>
            <Field label="Full name" required error={formErrors.fullName}>
              <input value={register.fullName} onChange={setField(setRegister, 'fullName')} onBlur={() => blurRegister('fullName')} className={`${inputClass} ${formErrors.fullName ? 'border-red-500' : ''}`} autoComplete="name" required />
            </Field>
            <Field label="Country" required error={formErrors.country}>
              <select
                value={register.country}
                onChange={setField(setRegister, 'country')}
                onBlur={() => blurRegister('country')}
                className={`${inputClass} ${formErrors.country ? 'border-red-500' : ''}`}
                autoComplete="country-name"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </Field>
            <Field
              label="Mobile"
              required
              error={formErrors.mobile || (avail.mobile.status === 'taken' ? avail.mobile.message : '')}
              hint={avail.mobile.status === 'checking' ? 'Checking…' : ''}
            >
              <div className="relative">
                <input
                  value={register.mobile}
                  onChange={setField(setRegister, 'mobile')}
                  onBlur={() => blurRegister('mobile')}
                  className={`${inputClass} ${avail.mobile.status === 'available' ? 'border-emerald-600 pr-11 focus:border-emerald-600 focus:ring-emerald-600/15' : formErrors.mobile || avail.mobile.status === 'taken' ? 'border-red-500' : ''}`}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
                {avail.mobile.status === 'available' ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" aria-label="Mobile number is available">
                    <CheckCircle2 size={18} />
                  </span>
                ) : null}
              </div>
            </Field>
            <Field
              label="Email"
              required
              error={formErrors.email || (avail.email.status === 'taken' ? avail.email.message : '')}
              hint={avail.email.status === 'checking' ? 'Checking…' : ''}
            >
              <div className="relative">
                <input
                  type="email"
                  value={register.email}
                  onChange={setField(setRegister, 'email')}
                  onBlur={() => blurRegister('email')}
                  className={`${inputClass} ${avail.email.status === 'available' ? 'border-emerald-600 pr-11 focus:border-emerald-600 focus:ring-emerald-600/15' : formErrors.email || avail.email.status === 'taken' ? 'border-red-500' : ''}`}
                  autoComplete="email"
                  required
                />
                {avail.email.status === 'available' ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" aria-label="Email is available">
                    <CheckCircle2 size={18} />
                  </span>
                ) : null}
              </div>
            </Field>
            <Field
              label="Username"
              required
              error={formErrors.username || (avail.username.status === 'taken' ? avail.username.message : '')}
              hint={avail.username.status === 'available' ? 'Username is available' : avail.username.status === 'checking' ? 'Checking…' : ''}
              hintTone={avail.username.status === 'available' ? 'ok' : undefined}
            >
              <input
                value={register.username}
                onChange={setField(setRegister, 'username')}
                onBlur={() => blurRegister('username')}
                className={`${inputClass} ${avail.username.status === 'available' ? 'border-emerald-600 focus:border-emerald-600 focus:ring-emerald-600/15' : formErrors.username || avail.username.status === 'taken' ? 'border-red-500' : ''}`}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Password" required error={formErrors.password}>
              <PasswordInput value={register.password} onChange={setField(setRegister, 'password')} onBlur={() => blurRegister('password')} autoComplete="new-password" required className={formErrors.password ? 'border-red-500' : ''} />
            </Field>
            <Field label="Confirm password" required error={formErrors.confirmPassword}>
              <PasswordInput value={register.confirmPassword} onChange={setField(setRegister, 'confirmPassword')} onBlur={() => blurRegister('confirmPassword')} autoComplete="new-password" required className={formErrors.confirmPassword ? 'border-red-500' : ''} />
            </Field>
            <div className="pt-1 text-sm text-[#475467]">
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={register.termsAccepted} onChange={setField(setRegister, 'termsAccepted')} className="mt-0.5 h-4 w-4 rounded border-slate-300" required />
                <span>I accept the <Link to="/legal/terms" className="font-medium text-[#e10600]">Terms</Link> and <Link to="/legal/privacy" className="font-medium text-[#e10600]">Privacy Policy</Link> <span className="text-[#e10600]">*</span></span>
              </label>
              {formErrors.terms ? <p className="mt-1.5 text-[12px] font-medium text-red-600">{formErrors.terms}</p> : null}
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
