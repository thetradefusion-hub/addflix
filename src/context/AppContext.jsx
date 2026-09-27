import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deposits as seedDeposits,
  notifications as seedNotes,
  taskHistory as seedTasks,
  walletAddress as fallbackAddress,
  walletTransactions as seedTx,
  withdrawals as seedWithdrawals,
} from "../data/mockData";
import { apiFetch, mapSessionUser } from "../lib/api";

const AppContext = createContext(null);

export const TODAY_ROI = 2.5;

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [walletAddress, setWalletAddress] = useState(fallbackAddress);
  const [plans, setPlans] = useState([]);
  const [depositAddress, setDepositAddress] = useState(fallbackAddress);
  const [subscriptionPrice, setSubscriptionPrice] = useState(10);
  const [network, setNetwork] = useState({ members: [], levels: [], total: 0, active: 0, direct: 0, commissionPerTen: 0 });
  const [subscriptionActive, setSubscriptionFlag] = useState(true);
  const [paymentState, setPaymentState] = useState("success");
  const [activatedAt, setActivatedAt] = useState("");
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);
  const [taskProgress, setTaskProgress] = useState(0);
  const [watching, setWatching] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [roiUnlocked, setRoiUnlocked] = useState(false);
  const [roiClaimed, setRoiClaimed] = useState(false);
  const [dailyTask, setDailyTask] = useState(null);
  const [roiDays, setRoiDays] = useState([]);
  const [balances, setBalances] = useState({
    total: 42.5,
    roi: 28.5,
    referral: 10,
    bonus: 2.5,
    locked: 1.5,
  });
  const [transactions, setTransactions] = useState(seedTx);
  const [income, setIncome] = useState([]);
  const [referralCredits, setReferralCredits] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [todayRoi, setTodayRoi] = useState(2.5);
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

  const applyAccount = (account) => {
    if (!account) return;
    setWalletAddress(account.walletAddress || fallbackAddress);
    setBalances(account.balances);
    setTransactions(Array.isArray(account.transactions) ? account.transactions : seedTx);
    setDepositRows(Array.isArray(account.deposits) ? account.deposits : seedDeposits);
    setWithdrawalRows(Array.isArray(account.withdrawals) ? account.withdrawals : seedWithdrawals);
    setIncome(Array.isArray(account.income) ? account.income : []);
    setReferralCredits(Array.isArray(account.referralCredits) ? account.referralCredits : []);
    setInvestments(Array.isArray(account.investments) ? account.investments : []);
    setTodayRoi(Number(account.todayRoi || 0));
    setTasks(Array.isArray(account.tasks) ? account.tasks : seedTasks);
    setSubscriptionFlag(Boolean(account.subscription?.active));
    setPaymentState(account.subscription?.paymentState || "idle");
    setActivatedAt(account.subscription?.activatedAt || "");
    setSubscriptionPayments(Array.isArray(account.subscriptionPayments) ? account.subscriptionPayments : []);
    setTaskProgress(account.dailyTask?.progress || 0);
    setTaskCompleted(Boolean(account.dailyTask?.completed));
    setRoiUnlocked(Boolean(account.dailyTask?.roiUnlocked));
    setRoiClaimed(Boolean(account.dailyTask?.roiClaimed));
    setDailyTask(account.dailyTask || null);
    setRoiDays(Array.isArray(account.roiDays) ? account.roiDays : []);
    if (Array.isArray(account.notifications)) {
      setNotes(account.notifications.map((note) => ({
        ...note,
        time: note.time ? new Date(note.time).toLocaleString() : "",
      })));
    }
  };

  const refreshSession = async () => {
    const token = localStorage.getItem("addflix_token");
    if (!token) {
      setSessionUser(null);
      return null;
    }
    const me = await apiFetch("/api/auth/me");
    if (me.user?.role === "admin") {
      localStorage.removeItem("addflix_token");
      localStorage.removeItem("addflix_user");
      setSessionUser(null);
      return null;
    }
    const [account, history, networkData] = await Promise.all([
      apiFetch("/api/account"),
      apiFetch("/api/auth/login-history"),
      apiFetch("/api/account/network"),
    ]);
    const mapped = mapSessionUser(me.user);
    setSessionUser(mapped);
    setLoginHistory(history.sessions || []);
    localStorage.setItem("addflix_user", JSON.stringify(me.user));
    applyAccount(account.account);
    setNetwork(networkData.network || { members: [], levels: [], total: 0, active: 0, direct: 0, commissionPerTen: 0 });
    return mapped;
  };

  useEffect(() => {
    refreshSession().catch(() => {});
    apiFetch("/api/platform")
      .then((data) => {
        setPlans(Array.isArray(data.plans) ? data.plans : []);
        if (data.depositAddress) setDepositAddress(data.depositAddress);
        if (data.subscriptionAmount) setSubscriptionPrice(Number(data.subscriptionAmount));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!watching || taskCompleted) return undefined;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const data = await apiFetch("/api/account/task", {
          method: "POST",
          body: JSON.stringify({ action: "heartbeat" }),
        });
        if (stopped) return;
        applyAccount(data.account);
        if ((data.account.dailyTask?.progress || 0) >= 100) setWatching(false);
      } catch (error) {
        if (stopped) return;
        setWatching(false);
        toast(error.message, "warning");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [watching, taskCompleted]);

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
    toast("Task started. Keep this page open while the video plays.", "info");
  };

  const reportPlayback = async (sample) => {
    const data = await apiFetch("/api/account/task", {
      method: "POST",
      body: JSON.stringify({ action: "playback", position: sample.position, duration: sample.duration, playing: sample.playing }),
    });
    applyAccount(data.account);
    return data.account;
  };

  const completeTask = async () => {
    try {
      const data = await apiFetch("/api/account/task", {
        method: "POST",
        body: JSON.stringify({ action: "complete" }),
      });
      applyAccount(data.account);
      setWatching(false);
      toast(data.message || "Task completed. Today's ROI is unlocked.");
      return true;
    } catch (error) {
      toast(error.message, "warning");
      return false;
    }
  };

  const claimRoi = async () => {
    if (roiClaimed) {
      toast("Today's ROI is already credited.");
      return { ok: false, reason: "claimed" };
    }
    if (!roiUnlocked) {
      toast("Complete today's activity to unlock your ROI.", "warning");
      return { ok: false, reason: "locked" };
    }
    try {
      const data = await apiFetch("/api/account/task", {
        method: "POST",
        body: JSON.stringify({ action: "claim" }),
      });
      applyAccount(data.account);
      toast(data.message || "Today's ROI of 2.50 USDT has been credited.");
      return { ok: true };
    } catch (error) {
      toast(error.message, "warning");
      return { ok: false, reason: "error" };
    }
  };

  const submitSubscription = async (hash) => {
    if (!hash || hash.trim().length < 8) {
      toast("Enter a valid transaction hash.", "warning");
      return false;
    }
    try {
      const data = await apiFetch("/api/account/subscription/submit", {
        method: "POST",
        body: JSON.stringify({ txHash: hash.trim() }),
      });
      applyAccount(data.account);
      toast(data.message || "Payment submitted.");
      return true;
    } catch (error) {
      toast(error.message, "warning");
      return false;
    }
  };

  const activateAccount = submitSubscription;

  const submitWithdrawal = async (payload) => {
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
    if (!/^0x[a-fA-F0-9]{40}$/.test(payload.address || "")) {
      toast("Enter a valid BEP-20 wallet address.", "warning");
      return false;
    }
    if (!/^\d{6}$/.test(payload.pin || "")) {
      toast("Enter your 6 digit transaction PIN.", "warning");
      return false;
    }
    try {
      const data = await apiFetch("/api/account/withdraw", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      applyAccount(data.account);
      toast(data.message || "Withdrawal request submitted.");
      return true;
    } catch (error) {
      toast(error.message, "warning");
      return false;
    }
  };

  const investInPlan = async (planId, amount) => {
    try {
      const data = await apiFetch("/api/account/invest", {
        method: "POST",
        body: JSON.stringify({ planId, amount: Number(amount) }),
      });
      applyAccount(data.account);
      toast(data.message || "Plan is active.");
      return true;
    } catch (error) {
      toast(error.message, "warning");
      return false;
    }
  };

  const submitTransfer = async ({ memberId, amount, pin }) => {
    try {
      const data = await apiFetch("/api/account/transfer", {
        method: "POST",
        body: JSON.stringify({ memberId, amount: Number(amount), pin }),
      });
      applyAccount(data.account);
      toast(data.message || "Transfer sent.");
      return true;
    } catch (error) {
      toast(error.message, "warning");
      return false;
    }
  };

  const submitDeposit = async (network, amount, tx) => {
    try {
      const data = await apiFetch("/api/account/deposit", {
        method: "POST",
        body: JSON.stringify({ network, amount: Number(amount), tx }),
      });
      applyAccount(data.account);
      toast(data.message || "Deposit is pending confirmation.");
      return true;
    } catch (error) {
      toast(error.message, "warning");
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* clear the local session even if the API is unreachable */
    }
    localStorage.removeItem("addflix_token");
    localStorage.removeItem("addflix_user");
    localStorage.removeItem("addflix_impersonating");
    setSessionUser(null);
    setLoginHistory([]);
    toast("You have been logged out.");
    navigate("/auth", { replace: true });
  };

  const resetTransactionPin = async (form) => {
    const data = await apiFetch("/api/auth/reset-transaction-pin", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const mapped = mapSessionUser(data.user);
    setSessionUser(mapped);
    localStorage.setItem("addflix_user", JSON.stringify(data.user));
    toast(data.message || "Withdrawal PIN updated.");
    return mapped;
  };

  const savePayoutWallet = async ({ address, pin }) => {
    const data = await apiFetch("/api/account/wallet-address", {
      method: "PATCH",
      body: JSON.stringify({ address, pin }),
    });
    applyAccount(data.account);
    toast(data.message || "Payout wallet updated.");
    return data.account?.walletAddress;
  };

  const saveProfile = async (form) => {
    const data = await apiFetch("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ fullName: form.name, mobile: form.phone, country: form.country }),
    });
    const mapped = mapSessionUser(data.user);
    setSessionUser(mapped);
    localStorage.setItem("addflix_user", JSON.stringify(data.user));
    toast(data.message || "Profile saved.");
    return mapped;
  };

  const markVideoWatched = async (video, progress = 100) => {
    try {
      const data = await apiFetch(`/api/account/videos/${video.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ progress }),
      });
      applyAccount(data.account);
      toast(data.message || "Video completed.");
      return true;
    } catch (error) {
      toast(error.message, "warning");
      return false;
    }
  };

  const markNotesRead = async () => {
    const data = await apiFetch("/api/account/notifications/read", { method: "POST" });
    applyAccount(data.account);
  };

  const unreadCount = notes.filter((note) => note.unread).length;

  const value = useMemo(
    () => ({
      subscriptionActive,
      paymentState,
      activatedAt,
      subscriptionPayments,
      taskProgress,
      watching,
      taskCompleted,
      roiUnlocked,
      roiClaimed,
      dailyTask,
      roiDays,
      balances,
      transactions,
      income,
      referralCredits,
      investments,
      todayRoi,
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
      reportPlayback,
      completeTask,
      claimRoi,
      activateAccount,
      submitSubscription,
      plans,
      depositAddress,
      subscriptionPrice,
      network,
      submitWithdrawal,
      submitTransfer,
      submitDeposit,
      investInPlan,
      saveProfile,
      resetTransactionPin,
      savePayoutWallet,
      refreshSession,
      logout,
      loginHistory,
      sessionUser,
      walletAddress,
      markVideoWatched,
      markNotesRead,
      setDepositRows,
    }),
    [
      subscriptionActive,
      paymentState,
      activatedAt,
      subscriptionPayments,
      taskProgress,
      watching,
      taskCompleted,
      roiUnlocked,
      roiClaimed,
      dailyTask,
      roiDays,
      balances,
      transactions,
      income,
      referralCredits,
      investments,
      todayRoi,
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
      sessionUser,
      loginHistory,
      walletAddress,
      plans,
      depositAddress,
      subscriptionPrice,
      network,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
