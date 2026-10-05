// Shared by the register form and the API so both apply the same rules.

const EMAIL = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

/** Returns a 10-digit Indian mobile or a +<country><number> international one, or "" when invalid. */
export function normalizeMobile(value) {
  const raw = String(value ?? "").trim();
  if (!/^\+?[\d\s()-]+$/.test(raw)) return "";
  const digits = raw.replace(/\D/g, "");
  const indian = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0")
      ? digits.slice(1)
      : digits.length === 10 && !raw.startsWith("+")
        ? digits
        : "";
  if (indian) {
    if (!/^[6-9]\d{9}$/.test(indian) || /^(\d)\1{9}$/.test(indian)) return "";
    return indian;
  }
  if (raw.startsWith("+") && !digits.startsWith("91") && /^[1-9]\d{7,14}$/.test(digits) && !/^(\d)\1+$/.test(digits.slice(-8))) {
    return `+${digits}`;
  }
  return "";
}

export function mobileError(value) {
  if (!String(value ?? "").trim()) return "Mobile number is required.";
  return normalizeMobile(value) ? "" : "Enter a valid 10-digit mobile number (starting with 6–9), or +country code for outside India.";
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
