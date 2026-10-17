import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const uploadDir = path.join(root, "public", "uploads");

const EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Save a data-URL offer image under public/uploads and return a public path. */
export async function saveOfferPopupImage(dataUrl) {
  const raw = String(dataUrl || "");
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    const error = new Error("Offer image must be a PNG, JPG, WEBP or GIF file.");
    error.status = 400;
    throw error;
  }
  const mime = match[1].toLowerCase();
  const ext = EXT[mime];
  if (!ext) {
    const error = new Error("Unsupported image type. Use PNG, JPG, WEBP or GIF.");
    error.status = 400;
    throw error;
  }
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > 2.5 * 1024 * 1024) {
    const error = new Error("Offer image must be under 2.5 MB.");
    error.status = 400;
    throw error;
  }
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `offer-popup.${ext}`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}?v=${Date.now()}`;
}

export function presentOfferPopup(settings) {
  const image = String(settings?.offerPopupImage || "").trim();
  const enabled = Boolean(settings?.offerPopupEnabled) && Boolean(image);
  return {
    enabled,
    image: enabled ? image : "",
    link: String(settings?.offerPopupLink || "").trim(),
    key: String(settings?.offerPopupKey || image || ""),
  };
}
