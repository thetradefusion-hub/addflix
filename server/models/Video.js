import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    durationSeconds: { type: Number, default: 120 },
    category: { type: String, default: "Promo" },
    reward: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
export default Video;
