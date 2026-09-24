export function validateRegistrationInput(payload = {}) {
  const errors = [];
  const fullName = String(payload.fullName ?? '').trim();
  const mobile = String(payload.mobile ?? '').trim();
  const email = String(payload.email ?? '').trim();
  const username = String(payload.username ?? '').trim();
  const password = String(payload.password ?? '');
  const confirmPassword = String(payload.confirmPassword ?? '');
  const sponsorId = String(payload.sponsorId ?? '').trim();
  const otp = String(payload.otp ?? '').trim();
  const termsAccepted = Boolean(payload.termsAccepted);
  const privacyAccepted = Boolean(payload.privacyAccepted);

  if (!fullName || fullName.length < 2) {
    errors.push('Full name is required.');
  }

  if (!/^[+()\d\s-]{8,20}$/.test(mobile)) {
    errors.push('Enter a valid mobile number.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Enter a valid email address.');
  }

  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long.');
  }

  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must be at least 8 characters and include uppercase, number and special character.');
  }

  if (password && password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (!sponsorId || sponsorId.length < 4) {
    errors.push('Sponsor or referral ID is required.');
  }

  if (!/^\d{6}$/.test(otp)) {
    errors.push('OTP must be a 6-digit code.');
  }

  if (!termsAccepted || !privacyAccepted) {
    errors.push('You must accept the Terms & Conditions and Privacy Policy.');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateLoginInput(payload = {}) {
  const login = String(payload.login ?? '').trim();
  const password = String(payload.password ?? '');
  const errors = [];

  if (!login) {
    errors.push('Email, mobile or username is required.');
  }

  if (!password || password.length < 6) {
    errors.push('Password is required.');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validatePasswordChangeInput(payload = {}) {
  const currentPassword = String(payload.currentPassword ?? '');
  const newPassword = String(payload.newPassword ?? '');
  const confirmPassword = String(payload.confirmPassword ?? '');
  const errors = [];

  if (!currentPassword || currentPassword.length < 6) {
    errors.push('Current password is required.');
  }

  if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
    errors.push('New password must be at least 8 characters and include uppercase, number and special character.');
  }

  if (newPassword && newPassword !== confirmPassword) {
    errors.push('New password and confirm password do not match.');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
