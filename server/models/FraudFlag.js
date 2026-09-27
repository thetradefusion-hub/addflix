import mongoose from "mongoose";

const fraudSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    status: { type: String, default: "Open" },
    deviceId: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    users: { type: Array, default: [] },
    note: { type: String, default: "" },
    hits: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const FraudFlag = mongoose.models.FraudFlag || mongoose.model("FraudFlag", fraudSchema);
export default FraudFlag;
