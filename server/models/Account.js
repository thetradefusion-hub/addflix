import mongoose from "mongoose";
import { previewTodayRoi, roiDayInfo } from "../utils/plans.js";
import { assignDailyTask, rollTask, todayKey } from "../utils/dailyTask.js";

export const TODAY_ROI = 2.5;

export { todayKey };

export function defaultDailyTask() {
  return assignDailyTask(todayKey());
}

const accountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    walletAddress: { type: String, default: "0x3A7F9D8e4B2c1F6d5E8a9B0c3D4eF6A7b8C9D0e1" },
    balances: {
      total: { type: Number, default: 0 },
      roi: { type: Number, default: 0 },
      referral: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      locked: { type: Number, default: 0 },
    },
    transactions: { type: Array, default: [] },
    deposits: { type: Array, default: [] },
    withdrawals: { type: Array, default: [] },
    income: { type: Array, default: [] },
    referralCredits: { type: Array, default: [] },
    levelCredits: { type: Array, default: [] },
    tasks: { type: Array, default: [] },
    roiDays: { type: Array, default: [] },
    investments: { type: Array, default: [] },
    subscriptionPayments: { type: Array, default: [] },
    notifications: { type: Array, default: [] },
    videoWatches: { type: Array, default: [] },
    subscription: {
      active: { type: Boolean, default: false },
      paymentState: { type: String, default: "idle" },
      txHash: { type: String, default: "" },
      amount: { type: Number, default: 10 },
      network: { type: String, default: "BEP-20" },
      activatedAt: { type: String, default: "" },
    },
    dailyTask: {
      day: { type: String, default: todayKey },
      title: { type: String, default: "Watch Sponsored Video" },
      subtitle: { type: String, default: "Premium Electric Cars" },
      videoUrl: { type: String, default: "/images/task-video.png" },
      durationSeconds: { type: Number, default: 120 },
      requiredPercent: { type: Number, default: 95 },
      watchSeconds: { type: Number, default: 0 },
      progress: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      roiUnlocked: { type: Boolean, default: false },
      roiClaimed: { type: Boolean, default: false },
      status: { type: String, default: "Pending" },
      lastHeartbeatAt: { type: Number, default: 0 },
      lastPosition: { type: Number, default: 0 },
      durationLocked: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

accountSchema.methods.rollTaskDay = function rollTaskDay() {
  return rollTask(this, todayKey());
};

accountSchema.methods.toClient = function toClient() {
  return {
    walletAddress: this.walletAddress,
    balances: this.balances,
    transactions: this.transactions,
    deposits: this.deposits,
    withdrawals: this.withdrawals,
    income: this.income,
    referralCredits: this.referralCredits || [],
    levelCredits: this.levelCredits || [],
    tasks: this.tasks,
    roiDays: this.roiDays || [],
    investments: this.investments || [],
    todayRoi: previewTodayRoi(this.investments || [], this.dailyTask?.day || todayKey()),
    roiDay: roiDayInfo(this.investments || [], this.dailyTask?.day || todayKey()),
    subscriptionPayments: this.subscriptionPayments || [],
    notifications: this.notifications || [],
    subscription: this.subscription,
    dailyTask: this.dailyTask,
  };
};

const Account = mongoose.models.Account || mongoose.model("Account", accountSchema);

export default Account;
