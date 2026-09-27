import mongoose from "mongoose";

const loginSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    device: { type: String, default: "Unknown device" },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "Unknown" },
    location: { type: String, default: "Unknown" },
    deviceId: { type: String, default: "", index: true },
    current: { type: Boolean, default: true },
    loggedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const LoginSession = mongoose.models.LoginSession || mongoose.model("LoginSession", loginSessionSchema);

export default LoginSession;
