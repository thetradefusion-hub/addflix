import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "platform", unique: true },
    subscriptionAmount: { type: Number, default: 10 },
    level1: { type: Number, default: 2 },
    level2: { type: Number, default: 1.5 },
    level3: { type: Number, default: 1 },
    level4: { type: Number, default: 0.5 },
    minWithdraw: { type: Number, default: 10 },
    withdrawFeeRate: { type: Number, default: 0.1 },
    taskTitle: { type: String, default: "Watch Sponsored Video" },
    taskSubtitle: { type: String, default: "Premium Electric Cars" },
    taskVideoUrl: { type: String, default: "/images/task-video.png" },
    taskDuration: { type: Number, default: 120 },
    taskRequired: { type: Number, default: 95 },
    taskPublished: { type: Boolean, default: true },
    bep20Rpc: { type: String, default: "" },
    depositAddress: { type: String, default: "0x3A7F9D8e4B2c1F6d5E8a9B0c3D4eF6A7b8C9D0e1" },
  },
  { timestamps: true }
);

const saveListeners = new Set();
export function onSettingsSaved(listener) {
  saveListeners.add(listener);
}
settingsSchema.post("save", () => saveListeners.forEach((listener) => listener()));

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

export default Settings;
