// Shared by the register form and the API so both apply the same rules.

const EMAIL = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

/** Free-form mobile: 6–15 digits, optional + / spaces / dashes / parentheses. */
export function normalizeMobile(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!/^[+\d\s().-]+$/.test(raw)) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return "";
  return raw.startsWith("+") ? `+${digits}` : digits;
}

export function mobileError(value) {
  if (!String(value ?? "").trim()) return "Mobile number is required.";
  return normalizeMobile(value) ? "" : "Enter a valid mobile number.";
}

export function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email) || email.includes("..")) return "";
  return email;
}

export function emailError(value) {
  if (!String(value ?? "").trim()) return "Email is required.";
  return normalizeEmail(value) ? "" : "Enter a valid email address, like name@example.com.";
}

export function normalizeReferralId(value) {
  return String(value ?? "").trim().toUpperCase();
}

export const REFERRAL_ID = /^ADD\d{4,8}$/;
