import express from "express";
import { readSettings } from "../utils/settings.js";
import { listPlans } from "../utils/planCatalog.js";

const router = express.Router();
const FALLBACK_ADDRESS = "0x3A7F9D8e4B2c1F6d5E8a9B0c3D4eF6A7b8C9D0e1";

router.get("/", async (_req, res) => {
  const [settings, plans] = await Promise.all([readSettings(), listPlans({ activeOnly: true })]);  res.json({
    ok: true,
    depositAddress: settings.depositAddress || FALLBACK_ADDRESS,
    subscriptionAmount: Number(settings.subscriptionAmount) || 10,
    signupBonus: Number(settings.signupBonus) || 0,
    plans,
  });
});

export default router;
