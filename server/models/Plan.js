import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    min: { type: Number, required: true },
    dailyRate: { type: Number, required: true },
    maxRoi: { type: Number, required: true },
    validity: { type: Number, required: true },
    accent: { type: String, default: "red" },
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);
export default Plan;
