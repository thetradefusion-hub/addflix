import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, message: "Authentication required." });
    }
    const decoded = jwt.verify(header.slice(7), env.jwtSecret);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ ok: false, message: "Session expired or invalid." });
    }
    if (user.role !== "admin" && user.active === false && decoded.act !== "admin") {
      return res.status(403).json({ ok: false, message: "This account is blocked." });
    }
    req.user = user;
    req.auth = decoded;
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: "Session expired or invalid." });
  }
}
