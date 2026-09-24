import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  deposits as seedDeposits,
  incomeSeed,
  notifications as seedNotes,
  taskHistory as seedTasks,
  walletTransactions as seedTx,
  withdrawals as seedWithdrawals,
} from "../data/mockData";

const AppContext = createContext(null);

export const TODAY_ROI = 2.5;

export function AppProvider({ children }) {
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [paymentState, setPaymentState] = useState("success");
  const [taskProgress, setTaskProgress] = useState(0);
  const [watching, setWatching] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [roiUnlocked, setRoiUnlocked] = useState(false);
  const [roiClaimed, setRoiClaimed] = useState(false);
  const [balances, setBalances] = useState({
    total: 42.5,
    roi: 28.5,
    referral: 10,
    bonus: 2.5,
    locked: 1.5,
  });
  const [transactions, setTransactions] = useState(seedTx);
  const [income, setIncome] = useState(incomeSeed);
  const [tasks, setTasks] = useState(seedTasks);
  const [notes, setNotes] = useState(seedNotes);
  const [depositRows, setDepositRows] = useState(seedDeposits);
  const [withdrawalRows, setWithdrawalRows] = useState(seedWithdrawals);
  const [watched, setWatched] = useState({});
  const [watchEarnings, setWatchEarnings] = useState(2.5);
  const [videosWatchedCount, setVideosWatchedCount] = useState(45);
  const [bonusVideos, setBonusVideos] = useState(2);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!watching) return undefined;
    const id = setInterval(() => {
      setTaskProgress((prev) => (prev >= 100 ? 100 : Math.min(100, prev + 4)));
    }, 350);
    return () => clearInterval(id);
  }, [watching]);

  useEffect(() => {
    if (taskProgress >= 100 && watching) setWatching(false);
  }, [taskProgress, watching]);

  const toast = (message, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 3200);
  };

  const dismissToast = (id) => setToasts((list) => list.filter((item) => item.id !== id));

  const startTask = () => {
    if (taskCompleted) {
      toast("Today's task is already completed.");
      return;
    }
    setWatching(true);
    if (taskProgress === 0) setTaskProgress(4);
    toast("Task started. Keep the video in focus.", "info");
  };

  const completeTask = () => {
    if (taskProgress < 95) {
      toast("Watch at least 95% of the video to complete the task.", "warning");
      return false;
    }
    setTaskCompleted(true);
    setRoiUnlocked(true);
    setWatching(false);
    setTaskProgress(100);
    setTasks((rows) => [
      {
        id: Date.now(),
        date: "25 Sep 2026",
        title: "Watch Sponsored Video",
        duration: "2 Minutes",
        completion: "100%",
        status: "Completed",
        roi: TODAY_ROI,
        claim: "Ready",
      },
      ...rows,
    ]);
    toast("Task completed. Today's ROI is unlocked.");
    return true;
  };

  const claimRoi = () => {
    if (roiClaimed) {
      toast("Today's ROI is already credited.");
      return { ok: false, reason: "claimed" };
    }
    if (!roiUnlocked) {
      toast("Complete today's activity to unlock your ROI.", "warning");
      return { ok: false, reason: "locked" };
    }
    setRoiClaimed(true);
    setBalances((prev) => ({
      ...prev,
      total: Number((prev.total + TODAY_ROI).toFixed(2)),
      roi: Number((prev.roi + TODAY_ROI).toFixed(2)),
    }));
    const tx = `TX${Math.floor(1000 + Math.random() * 9000)}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const row = {
      id: Date.now(),
      date: "25 Sep 2026, 12:40 AM",
      type: "ROI Income",
      description: "Daily ROI (Standard Plan)",
      amount: TODAY_ROI,
      status: "Credited",
      tx,
    };
    setIncome((rows) => [row, ...rows]);
    setTransactions((rows) => [
      {
        id: Date.now(),
        date: "25 Sep 2026, 12:40 AM",
        type: "ROI Credit",
        amount: TODAY_ROI,
        status: "Success",
        direction: "credit",
      },
      ...rows,
    ]);
    setTasks((rows) =>
      rows.map((item, index) => (index === 0 && item.claim === "Ready" ? { ...item, claim: "Claimed" } : item))
    );
    toast("Today's ROI of 2.50 USDT has been credited.");
    return { ok: true };
  };

  const activateAccount = (hash) => {
    if (!hash || hash.trim().length < 8) {
      toast("Enter a valid transaction hash.", "warning");
      return;
    }
    setPaymentState("pending");
    setTimeout(() => {
      setPaymentState("success");
      setSubscriptionActive(true);
      toast("Account activated. Your subscription is now active.");
    }, 1400);
  };

  const submitWithdrawal = (payload) => {
    const amount = Number(payload.amount);
    const withdrawable = Number((balances.total - balances.locked).toFixed(2));
    if (!amount || amount < 10) {
      toast("Minimum withdrawal is 10 USDT.", "warning");
      return false;
    }
    if (amount > withdrawable) {
      toast("Amount cannot exceed your withdrawable balance.", "warning");
      return false;
    }
    if (!payload.address || payload.address.trim().length < 10) {
      toast("Enter a valid wallet address.", "warning");
      return false;
    }
    if (!/^\d{6}$/.test(payload.pin || "")) {
      toast("Enter your 6 digit transaction PIN.", "warning");
      return false;
    }
    const fee = Number((amount * 0.1).toFixed(2));
    const receive = Number((amount - fee).toFixed(2));
    setWithdrawalRows((rows) => [
      {
        id: Date.now(),
        date: "25 Sep 2026, 12:45 AM",
        tx: "Pending",
        amount,
        fee,
        receive,
        status: "Pending",
        address: payload.address,
      },
      ...rows,
    ]);
    setBalances((prev) => ({
      ...prev,
      total: Number((prev.total - amount).toFixed(2)),
      locked: Number((prev.locked + amount).toFixed(2)),
    }));
    setTransactions((rows) => [
      {
        id: Date.now(),
        date: "25 Sep 2026, 12:45 AM",
        type: "Withdrawal",
        amount: -amount,
        status: "Pending",
        direction: "debit",
      },
      ...rows,
    ]);
    toast("Withdrawal request submitted.");
    return true;
  };

  const markVideoWatched = (video) => {
    if (watched[video.id]) {
      toast("You already earned from this video today.", "info");
      return;
    }
    setWatched((prev) => ({ ...prev, [video.id]: true }));
    setWatchEarnings((n) => Number((n + video.reward).toFixed(2)));
    setVideosWatchedCount((n) => n + 1);
    setBonusVideos((n) => Math.min(10, n + 1));
    setBalances((prev) => ({
      ...prev,
      total: Number((prev.total + video.reward).toFixed(2)),
      bonus: Number((prev.bonus + video.reward).toFixed(2)),
    }));
    setIncome((rows) => [
      {
        id: Date.now(),
        date: "25 Sep 2026, 12:50 AM",
        type: "Bonus Income",
        description: video.title,
        amount: video.reward,
        status: "Credited",
        tx: `TX${Math.floor(1000 + Math.random() * 9000)}...VID`,
      },
      ...rows,
    ]);
    toast(`+${video.reward.toFixed(2)} USDT credited for watching.`);
  };

  const markNotesRead = () => setNotes((rows) => rows.map((note) => ({ ...note, unread: false })));

  const unreadCount = notes.filter((note) => note.unread).length;

  const value = useMemo(
    () => ({
      subscriptionActive,
      paymentState,
      taskProgress,
      watching,
      taskCompleted,
      roiUnlocked,
      roiClaimed,
      balances,
      transactions,
      income,
      tasks,
      notes,
      unreadCount,
      depositRows,
      withdrawalRows,
      watched,
      watchEarnings,
      videosWatchedCount,
      bonusVideos,
      toasts,
      modal,
      setModal,
      toast,
      dismissToast,
      startTask,
      completeTask,
      claimRoi,
      activateAccount,
      setSubscriptionActive,
      submitWithdrawal,
      markVideoWatched,
      markNotesRead,
      setDepositRows,
    }),
    [
      subscriptionActive,
      paymentState,
      taskProgress,
      watching,
      taskCompleted,
      roiUnlocked,
      roiClaimed,
      balances,
      transactions,
      income,
      tasks,
      notes,
      unreadCount,
      depositRows,
      withdrawalRows,
      watched,
      watchEarnings,
      videosWatchedCount,
      bonusVideos,
      toasts,
      modal,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
