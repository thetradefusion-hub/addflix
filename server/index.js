import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import AppSeed from "./models/AppSeed.js";

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  const state = mongoose.connection.readyState;
  const labels = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    ok: state === 1,
    service: "addflix-api",
    env: env.nodeEnv,
    db: labels[state] || "unknown",
    name: mongoose.connection.name || env.mongoDb,
  });
});

app.get("/api/bootstrap", async (_req, res) => {
  try {
    const seed = await AppSeed.findOne({ key: "dashboard-demo" }).lean();
    res.json({
      ok: true,
      data: seed?.data ?? {},
      message: "Demo bootstrap loaded.",
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ ok: false, message: "Unable to load bootstrap data." });
  }
});

app.use("/api/auth", authRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, message: "API route not found." });
});

async function start() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`ADD FLIX API http://127.0.0.1:${env.port}`);
    console.log(`MongoDB connected · ${mongoose.connection.name}`);
  });
}

start().catch((err) => {
  console.error("Server failed to start:", err.message);
  process.exit(1);
});
