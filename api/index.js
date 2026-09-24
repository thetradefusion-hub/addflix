import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from '../server/config/env.js';
import { connectDb } from '../server/config/db.js';
import authRoutes from '../server/routes/auth.js';
import AppSeed from '../server/models/AppSeed.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const state = mongoose.connection.readyState;
  const labels = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    ok: state === 1,
    service: 'addflix-api',
    env: env.nodeEnv,
    db: labels[state] || 'unknown',
    name: mongoose.connection.name || env.mongoDb,
  });
});

app.get('/api/bootstrap', async (_req, res) => {
  try {
    const seed = await AppSeed.findOne({ key: 'dashboard-demo' }).lean();
    res.json({
      ok: true,
      data: seed?.data ?? {},
      message: 'Demo bootstrap loaded.',
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ ok: false, message: 'Unable to load bootstrap data.' });
  }
});

app.use('/api/auth', authRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, message: 'API route not found.' });
});

export default async function handler(req, res) {
  if (!mongoose.connection.readyState) {
    await connectDb();
  }

  return app(req, res);
}

export const config = {
  runtime: 'nodejs',
};
