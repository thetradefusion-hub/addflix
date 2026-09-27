import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    target: { type: String, default: "" },
    note: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditSchema);

export default AuditLog;
