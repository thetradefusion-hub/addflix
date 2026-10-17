import mongoose from "mongoose";

const cmsSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: [String], default: [] },
    contentVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CmsPage = mongoose.models.CmsPage || mongoose.model("CmsPage", cmsSchema);
export default CmsPage;
