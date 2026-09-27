import { requireAuth } from "./requireAuth.js";
import { can } from "../utils/roles.js";

export function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Admin access only." });
    }
    return next();
  });
}

export function requireDuty(duty) {
  return (req, res, next) => {
    if (!can(req.user, duty)) {
      return res.status(403).json({ ok: false, message: "Your admin role cannot do that." });
    }
    return next();
  };
}
