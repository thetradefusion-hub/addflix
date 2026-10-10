import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Account, { defaultDailyTask } from '../models/Account.js';
import LoginSession from '../models/LoginSession.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { describeClient, formatSessionTime } from '../utils/clientInfo.js';
import { env } from '../config/env.js';
import { validateLoginInput, validatePasswordChangeInput, validateRegistrationInput } from '../utils/authValidation.js';
import { normalizeEmail, normalizeMobile } from '../../shared/contact.js';
import AuditLog from '../models/AuditLog.js';
import { noteSharedDevice } from '../utils/fraud.js';
import { readSettings } from '../utils/settings.js';
import { istStamp } from '../utils/day.js';

const router = express.Router();
const JWT_SECRET = env.jwtSecret;

export function buildPublicUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    mobile: user.mobile,
    email: user.email,
    username: user.username,
    sponsorId: user.sponsorId,
    referralId: user.referralId,
    country: user.country || 'India',
    otpVerified: user.otpVerified,
    termsAccepted: user.termsAccepted,
    privacyAccepted: user.privacyAccepted,
    twoFactorEnabled: user.twoFactorEnabled,
    transactionPinSet: Boolean(user.transactionPin),
    role: user.role || "member",
    adminRole: user.adminRole || "",
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function signToken(user, sessionId, extra = {}) {
  return jwt.sign({ sub: user._id.toString(), email: user.email, sid: sessionId?.toString(), ...extra }, JWT_SECRET, { expiresIn: '7d' });
}

async function openSession(user, req, deviceId) {
  await LoginSession.updateMany({ user: user._id, current: true }, { $set: { current: false, endedAt: new Date() } });
  const info = describeClient(req);
  return LoginSession.create({
    user: user._id,
    ...info,
    deviceId: String(deviceId || "").slice(0, 80),
    current: true,
    loggedAt: new Date(),
  });
}

router.post('/register', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const validation = validateRegistrationInput(payload);

    if (!validation.ok) {
      return res.status(400).json({ ok: false, message: validation.errors[0] || 'Validation failed.', errors: validation.errors });
    }

    const email = normalizeEmail(payload.email);
    const mobile = normalizeMobile(payload.mobile);
    const username = String(payload.username).trim().toLowerCase();
    const fullName = String(payload.fullName).trim();
    const sponsorId = String(payload.sponsorId).trim().toUpperCase();
    const otp = String(payload.otp).trim();

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ ok: false, message: 'An account with this email, mobile or username already exists.' });
    }

    const sponsor = await User.findOne({ referralId: sponsorId });
    if (!sponsor) {
      return res.status(400).json({ ok: false, message: 'Sponsor referral ID is invalid or not found.' });
    }

    if (otp !== '123456') {
      return res.status(400).json({ ok: false, message: 'Invalid OTP. Use the demo OTP code 123456.' });
    }

    const passwordHash = await bcrypt.hash(String(payload.password), 10);
    const referralId = `ADD${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      fullName,
      mobile,
      email,
      username,
      passwordHash,
      sponsorId: sponsor.referralId,
      referralId,
      country: 'India',
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      twoFactorEnabled: false,
      transactionPin: '',
    });

    const settings = await readSettings();
    const signupBonus = Number(Number(settings.signupBonus || 0).toFixed(2));
    const account = {
      user: user._id,
      dailyTask: defaultDailyTask(),
      subscription: { active: false, paymentState: 'idle', txHash: '', amount: Number(settings.subscriptionAmount) || 10, network: 'BEP-20' },
    };
    if (signupBonus > 0) {
      const when = istStamp();
      account.balances = { total: signupBonus, roi: 0, referral: 0, bonus: signupBonus, locked: 0 };
      account.income = [{
        id: `SIGNUP-${referralId}`,
        date: when,
        type: 'Bonus Income',
        description: 'Signup bonus',
        amount: signupBonus,
        status: 'Credited',
        tx: `SIGNUP-${referralId}`,
      }];
      account.transactions = [{
        id: `SIGNUP-${referralId}-tx`,
        date: when,
        type: 'Signup Bonus',
        amount: signupBonus,
        status: 'Success',
        direction: 'credit',
        description: 'Signup bonus',
      }];
      account.notifications = [{
        id: `SIGNUP-${referralId}-note`,
        title: 'Signup bonus',
        body: `$${signupBonus.toFixed(2)} was added to your wallet.`,
        kind: 'wallet',
        unread: true,
        time: new Date().toISOString(),
      }];
    }
    await Account.create(account);
    const session = await openSession(user, req);

    res.status(201).json({
      ok: true,
      message: signupBonus > 0 ? `Account created. $${signupBonus.toFixed(2)} signup bonus was added to your wallet.` : 'Account created successfully.',
      signupBonus,
      token: signToken(user, session._id),
      user: buildPublicUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ ok: false, message: 'Something went wrong while creating your account.' });
  }
});

router.get('/sponsor/:code', async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const sponsor = await User.findOne({ referralId: code, role: { $ne: 'admin' } }).select('fullName referralId');
  if (!sponsor) {
    return res.status(404).json({ ok: false, message: 'Sponsor referral ID is invalid or not found.' });
  }
  res.json({ ok: true, sponsor: { name: sponsor.fullName, id: sponsor.referralId } });
});

router.post('/login', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const validation = validateLoginInput(payload);

    if (!validation.ok) {
      return res.status(400).json({ ok: false, message: 'Validation failed.', errors: validation.errors });
    }

    const loginValue = String(payload.login).trim();
    const password = String(payload.password);
    const otp = String(payload.otp ?? '').trim();

    const user = await User.findOne({
      $or: [{ email: loginValue.toLowerCase() }, { mobile: loginValue }, { username: loginValue.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid email/mobile/username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: 'Invalid email/mobile/username or password.' });
    }

    const portal = payload.portal === 'admin' ? 'admin' : 'member';
    if (portal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'This sign-in is for admin accounts only.' });
    }
    if (portal === 'member' && user.role === 'admin') {
      return res.status(403).json({ ok: false, message: 'Admin accounts sign in at the admin login.' });
    }

    if (user.role !== 'admin' && user.active === false) {
      return res.status(403).json({ ok: false, message: 'This account is blocked.' });
    }

    if (user.twoFactorEnabled && otp !== '123456') {
      return res.status(400).json({ ok: false, message: 'Two-factor verification failed. Use demo OTP 123456.' });
    }

    user.lastLogin = new Date();
    await user.save();
    const session = await openSession(user, req, payload.deviceId);
    await noteSharedDevice(user, payload.deviceId);
    if (portal === 'admin') {
      await AuditLog.create({
        admin: user._id,
        action: 'admin.login',
        target: user.email,
        note: user.adminRole || 'super',
      });
    }

    res.json({
      ok: true,
      message: 'Login successful.',
      token: signToken(user, session._id),
      user: buildPublicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ ok: false, message: 'Unable to login right now.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'No account found with that email.' });
    }

    user.resetToken = `reset-${Date.now()}`;
    await user.save();

    return res.json({
      ok: true,
      message: 'Password reset code generated. Use the demo OTP 123456 to continue.',
      resetToken: user.resetToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ ok: false, message: 'Unable to process password reset.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body ?? {};
    const emailKey = String(email ?? '').trim().toLowerCase();

    if (!emailKey || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ ok: false, message: 'Email, OTP and new password are required.' });
    }

    if (String(otp).trim() !== '123456') {
      return res.status(400).json({ ok: false, message: 'Invalid OTP. Use the demo OTP 123456.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ ok: false, message: 'Passwords do not match.' });
    }

    const user = await User.findOne({ email: emailKey });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'No account found with that email.' });
    }

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(newPassword)) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters and include uppercase, number and special character.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    await user.save();

    return res.json({ ok: true, message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ ok: false, message: 'Unable to reset password right now.' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const validation = validatePasswordChangeInput(payload);

    if (!validation.ok) {
      return res.status(400).json({ ok: false, message: 'Validation failed.', errors: validation.errors });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found.' });
    }

    const currentMatch = await bcrypt.compare(String(payload.currentPassword), user.passwordHash);
    if (!currentMatch) {
      return res.status(400).json({ ok: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(String(payload.newPassword), 10);
    await user.save();

    res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ ok: false, message: 'Unable to change password.' });
  }
});

router.post('/reset-transaction-pin', requireAuth, async (req, res) => {
  try {
    const pin = String(req.body?.pin ?? '').trim();
    const confirm = String(req.body?.confirm ?? '').trim();
    const currentPin = String(req.body?.currentPin ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({ ok: false, message: 'Withdrawal PIN must be exactly 6 digits.' });
    }
    if (pin !== confirm) {
      return res.status(400).json({ ok: false, message: 'New PIN and confirm PIN do not match.' });
    }
    const user = req.user;
    if (password) {
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(400).json({ ok: false, message: 'Login password is incorrect.' });
    } else if (user.transactionPin && currentPin !== user.transactionPin) {
      return res.status(400).json({ ok: false, message: 'Current withdrawal PIN is incorrect.' });
    }
    user.transactionPin = pin;
    await user.save();
    return res.json({ ok: true, message: 'Withdrawal PIN updated.', user: buildPublicUser(user) });
  } catch (error) {
    console.error('Reset transaction pin error:', error);
    return res.status(500).json({ ok: false, message: 'Unable to update withdrawal PIN.' });
  }
});

router.post('/set-transaction-pin', async (req, res) => {
  try {
    const pin = String(req.body?.pin ?? '').trim();
    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({ ok: false, message: 'Transaction PIN must be exactly 6 digits.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found.' });
    }

    user.transactionPin = pin;
    await user.save();

    return res.json({ ok: true, message: 'Transaction PIN set successfully.' });
  } catch (error) {
    console.error('Set transaction pin error:', error);
    res.status(500).json({ ok: false, message: 'Unable to set transaction PIN.' });
  }
});

router.post('/toggle-2fa', async (req, res) => {
  try {
    const enabled = Boolean(req.body?.enabled);
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found.' });
    }

    user.twoFactorEnabled = enabled;
    await user.save();

    return res.json({ ok: true, message: enabled ? '2FA enabled.' : '2FA disabled.', twoFactorEnabled: enabled });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({ ok: false, message: 'Unable to update 2FA settings.' });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found.' });

    const fullName = String(req.body?.fullName ?? '').trim();
    const mobile = String(req.body?.mobile ?? '').trim();
    const country = String(req.body?.country ?? '').trim();
    if (fullName.length < 2) return res.status(400).json({ ok: false, message: 'Enter your full name.' });
    if (mobile.length < 8) return res.status(400).json({ ok: false, message: 'Enter a valid mobile number.' });

    const clash = await User.findOne({ mobile, _id: { $ne: user._id } });
    if (clash) return res.status(409).json({ ok: false, message: 'This mobile number is already in use.' });

    user.fullName = fullName;
    user.mobile = mobile;
    if (country) user.country = country;
    await user.save();
    return res.json({ ok: true, message: 'Profile saved.', user: buildPublicUser(user) });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ ok: false, message: 'Unable to save profile.' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found.' });
    }

    return res.json({ ok: true, user: buildPublicUser(user) });
  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Session expired or invalid.' });
  }
});

router.get('/login-history', requireAuth, async (req, res) => {
  const rows = await LoginSession.find({ user: req.user._id }).sort({ loggedAt: -1 }).limit(20).lean();
  res.json({
    ok: true,
    sessions: rows.map((row) => ({
      id: row._id,
      device: row.device,
      ip: row.ip,
      location: row.location,
      time: formatSessionTime(row.loggedAt || row.createdAt),
      current: Boolean(row.current) && !row.endedAt,
    })),
  });
});

router.post('/logout', requireAuth, async (req, res) => {
  const sid = req.auth?.sid;
  if (sid) {
    await LoginSession.findOneAndUpdate({ _id: sid, user: req.user._id }, { current: false, endedAt: new Date() });
  } else {
    const open = await LoginSession.findOne({ user: req.user._id, current: true }).sort({ loggedAt: -1 });
    if (open) {
      open.current = false;
      open.endedAt = new Date();
      await open.save();
    }
  }
  res.json({ ok: true, message: 'Logged out successfully.' });
});

export default router;
