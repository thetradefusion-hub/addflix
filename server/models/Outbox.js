import mongoose from "mongoose";

const outboxSchema = new mongoose.Schema(
  {
    channel: { type: String, required: true },
    to: { type: String, default: "" },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    status: { type: String, default: "Demo queued" },
  },
  { timestamps: true }
);

const Outbox = mongoose.models.Outbox || mongoose.model("Outbox", outboxSchema);
export default Outbox;
