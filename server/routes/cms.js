import express from "express";
import CmsPage from "../models/CmsPage.js";

const router = express.Router();

router.get("/:slug", async (req, res) => {
  const page = await CmsPage.findOne({ slug: req.params.slug }).lean();
  if (!page) return res.status(404).json({ ok: false, message: "Page not found." });
  res.json({ ok: true, page: { slug: page.slug, title: page.title, body: page.body || [] } });
});

export default router;
