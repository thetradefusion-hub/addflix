import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: resolve(root, ".env") });

const required = ["MONGODB_URI"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing env: ${missing.join(", ")}. Copy .env.example to .env.`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
  mongoUri: process.env.MONGODB_URI,
  mongoDb: process.env.MONGODB_DB || "addflix",
};
