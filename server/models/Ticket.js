import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    status: { type: String, default: "Open" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assigneeName: { type: String, default: "" },
    messages: { type: Array, default: [] },
  },
  { timestamps: true }
);

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
export default Ticket;
