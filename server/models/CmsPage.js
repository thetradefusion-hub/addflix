import mongoose from "mongoose";

const cmsSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: [String], default: [] },
  },
  { timestamps: true }
);

const CmsPage = mongoose.models.CmsPage || mongoose.model("CmsPage", cmsSchema);
export default CmsPage;
