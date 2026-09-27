export const DUTIES = {
  overview: ["super", "finance", "content", "support", "operations"],
  users: ["super", "finance", "support", "operations"],
  "users.status": ["super", "operations"],
  wallet: ["super", "finance"],
  withdrawals: ["super", "finance"],
  deposits: ["super", "finance"],
  settings: ["super"],
  content: ["super", "content"],
  tickets: ["super", "support"],
  fraud: ["super", "operations"],
  audit: ["super", "finance", "operations"],
  outbox: ["super", "support"],
};

export function adminDuty(user) {
  if (user?.role !== "admin") return "";
  return user.adminRole || "super";
}

export function can(user) {
  return user?.role === "admin";
}
