const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const ADMIN_TOKEN_KEY = "addflix_admin_token";
export const ADMIN_USER_KEY = "addflix_admin_user";

export function readAdminSession() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return null;
  try {
    const user = JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
    if (user?.role !== "admin") return null;
    return { token, user };
  } catch {
    return null;
  }
}

export function saveAdminSession(token, user) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = path.startsWith("/api/admin")
    ? localStorage.getItem(ADMIN_TOKEN_KEY)
    : localStorage.getItem("addflix_token");
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: "Server returned an invalid response." };
    }
  }
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export function mapSessionUser(user) {
  if (!user) return null;
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  return {
    name: user.fullName,
    id: user.referralId,
    email: user.email,
    phone: user.mobile,
    country: user.country || "India",
    joined,
    language: "English",
    referralLink: user.referralId ? `${window.location.origin}/ref/${user.referralId}` : "",
    pinSet: Boolean(user.transactionPinSet),
  };
}
