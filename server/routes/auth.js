import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateLoginInput, validatePasswordChangeInput, validateRegistrationInput } from '../utils/authValidation.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'addflix-demo-secret';

function buildPublicUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    mobile: user.mobile,
    email: user.email,
    username: user.username,
    sponsorId: user.sponsorId,
    referralId: user.referralId,
    otpVerified: user.otpVerified,
    termsAccepted: user.termsAccepted,
    privacyAccepted: user.privacyAccepted,
    twoFactorEnabled: user.twoFactorEnabled,
    transactionPinSet: Boolean(user.transactionPin),
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const validation = validateRegistrationInput(payload);

    if (!validation.ok) {
      return res.status(400).json({ ok: false, message: 'Validation failed.', errors: validation.errors });
    }

    const email = String(payload.email).trim().toLowerCase();
    const mobile = String(payload.mobile).trim();
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
      otpVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      twoFactorEnabled: false,
      transactionPin: '',
    });

    res.status(201).json({
      ok: true,
      message: 'Account created successfully.',
      token: signToken(user),
      user: buildPublicUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ ok: false, message: 'Something went wrong while creating your account.' });
  }
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

    if (user.twoFactorEnabled && otp !== '123456') {
      return res.status(400).json({ ok: false, message: 'Two-factor verification failed. Use demo OTP 123456.' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      ok: true,
      message: 'Login successful.',
      token: signToken(user),
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

router.post('/logout', (_req, res) => {
  res.json({ ok: true, message: 'Logged out successfully.' });
});

export default router;
