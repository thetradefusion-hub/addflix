import { istStamp } from "./day.js";

export function describeClient(req) {
  const ua = String(req.get("user-agent") || "Unknown device");
  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iPhone";
  else if (/Mac OS/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const raw = (forwarded || req.ip || "Unknown").replace("::ffff:", "");
  const ip = raw === "::1" ? "127.0.0.1" : raw;
  const location = ip === "127.0.0.1" ? "This network" : "Unknown";

  return {
    device: `${browser} · ${os}`,
    userAgent: ua.slice(0, 300),
    ip: maskIp(ip),
    location,
  };
}

function maskIp(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4 || ip === "127.0.0.1") return ip;
  return `${parts[0]}.${parts[1]}.xx.xx`;
}

export function formatSessionTime(date) {
  return istStamp(new Date(date));
}
