export function parsePlayableUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(value)) return null;

  let parsed;
  try {
    parsed = new URL(value, "http://localhost");
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(parsed.pathname)) {
    return { kind: "file", src: value };
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id ? { kind: "youtube", id } : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? { kind: "youtube", id } : null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if ((parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") && parts[1]) {
      return { kind: "youtube", id: parts[1].slice(0, 20) };
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = [...parsed.pathname.split("/").filter(Boolean)].reverse().find((part) => /^\d+$/.test(part));
    return id ? { kind: "vimeo", id } : null;
  }

  return null;
}
