import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, mapSessionUser } from "../lib/api";

const AppContext = createContext(null);

export const TODAY_ROI = 2.5;

const TOKEN_KEY = "addflix_token";
const USER_KEY = "addflix_user";
const CACHE_PREFIX = "addflix_account_";
const EMPTY_BALANCES = { total: 0, roi: 0, referral: 0, bonus: 0, locked: 0 };
const EMPTY_NETWORK = { members: [], levels: [], total: 0, active: 0, direct: 0, commissionPerTen: 0 };

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function cacheKey(user) {
  return user?.referralId ? `${CACHE_PREFIX}${user.referralId}` : "";
}

function readCachedAccount(user) {
  const key = cacheKey(user);
  if (!key) return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function clearAccountCaches() {
  Object.keys(localStorage).filter((key) => key.startsWith(CACHE_PREFIX)).forEach((key) => localStorage.removeItem(key));
}

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem(TOKEN_KEY) ? readStoredUser() : null;
  const [sessionUser, setSessionUser] = useState(() => (storedUser?.role === "admin" ? null : mapSessionUser(storedUser)));
  const [accountReady, setAccountReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [loginHistory, setLoginHistory] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [plans, setPlans] = useState([]);
  const [depositAddress, setDepositAddress] = useState("");
  const [subscriptionPrice, setSubscriptionPrice] = useState(10);
  const [network, setNetwork] = useState(EMPTY_NETWORK);
  const [subscriptionActive, setSubscriptionFlag] = useState(false);
  const [paymentState, setPaymentState] = useState("idle");
  const [activatedAt, setActivatedAt] = useState("");
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);
  const [taskProgress, setTaskProgress] = useState(0);
  const [watching, setWatching] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [roiUnlocked, setRoiUnlocked] = useState(false);
  const [roiClaimed, setRoiClaimed] = useState(false);
  const [dailyTask, setDailyTask] = useState(null);
  const [roiDays, setRoiDays] = useState([]);
  const [balances, setBalances] = useState(EMPTY_BALANCES);
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState([]);
  const [referralCredits, setReferralCredits] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [todayRoi, setTodayRoi] = useState(0);
  const [roiDay, setRoiDay] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [depositRows, setDepositRows] = useState([]);
  const [withdrawalRows, setWithdrawalRows] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const sessionSeq = useRef(0);
  const sessionCode = useRef(storedUser?.referralId || "");

  const applyTask = (task) => {
    if (!task) return;
    setTaskProgress(task.progress || 0);
    setTaskCompleted(Boolean(task.completed));
    setRoiUnlocked(Boolean(task.roiUnlocked));
    setRoiClaimed(Boolean(task.roiClaimed));
    setDailyTask(task);
  };

  const applyAccount = (account, { cache = true } = {}) => {
    if (!account) return;
    setWalletAddress(account.walletAddress || "");
    setBalances(account.balances || EMPTY_BALANCES);
    setTransactions(Array.isArray(account.transactions) ? account.transactions : []);
    setDepositRows(Array.isArray(account.deposits) ? account.deposits : []);
    setWithdrawalRows(Array.isArray(account.withdrawals) ? account.withdrawals : []);
    setIncome(Array.isArray(account.income) ? account.income : []);
    setReferralCredits(Array.isArray(account.referralCredits) ? account.referralCredits : []);
    setInvestments(Array.isArray(account.investments) ? account.investments : []);
    setTodayRoi(Number(account.todayRoi || 0));
    setRoiDay(account.roiDay || null);
    setTasks(Array.isArray(account.tasks) ? account.tasks : []);
    setSubscriptionFlag(Boolean(account.subscription?.active));
    setPaymentState(account.subscription?.paymentState || "idle");
    setActivatedAt(account.subscription?.activatedAt || "");
    setSubscriptionPayments(Array.isArray(account.subscriptionPayments) ? account.subscriptionPayments : []);
    applyTask(account.dailyTask);
    setRoiDays(Array.isArray(account.roiDays) ? account.roiDays : []);
    setNotes((Array.isArray(account.notifications) ? account.notifications : []).map((note) => ({
      ...note,
      time: note.time ? new Date(note.time).toLocaleString() : "",
    })));
    if (cache && sessionCode.current) {
      try {
        localStorage.setItem(`${CACHE_PREFIX}${sessionCode.current}`, JSON.stringify(account));
      } catch {
        /* storage full: the live data is still shown */
      }
    }
  };

  const applyLive = (data) => {
    if (!data?.account) return;
    if (data.partial) {
      applyTask(data.account.dailyTask);
      if (data.account.roiDay) setRoiDay(data.account.roiDay);
      if (data.account.todayRoi !== undefined) setTodayRoi(Number(data.account.todayRoi || 0));
      return;
    }
    applyAccount(data.account);
  };

  const resetAccount = () => {
    setAccountReady(false);
    setLoginHistory([]);
    setNetwork(EMPTY_NETWORK);
    setWatching(false);
    applyAccount({ balances: EMPTY_BALANCES }, { cache: false });
    setDailyTask(null);
  };

  const signOutLocally = () => {
    sessionSeq.current += 1;
    sessionCode.current = "";
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("addflix_impersonating");
    clearAccountCaches();
    setSessionUser(null);
    resetAccount();
  };

  const loadExtras = (seq) => {
    apiFetch("/api/auth/login-history")
      .then((data) => { if (seq === sessionSeq.current) setLoginHistory(data.sessions || []); })
      .catch(() => {});
    apiFetch("/api/account/network")
      .then((data) => { if (seq === sessionSeq.current) setNetwork(data.network || EMPTY_NETWORK); })
      .catch(() => {});
  };

  const refreshSession = async (user = readStoredUser()) => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      signOutLocally();
      return null;
    }
    const seq = ++sessionSeq.current;
    setSessionError("");
    if (user?.referralId && user.referralId !== sessionCode.current) {
      sessionCode.current = user.referralId;
      resetAccount();
    }
    if (user && user.role !== "admin") {
      setSessionUser(mapSessionUser(user));
      const cached = readCachedAccount(user);
      if (cached) {
        applyAccount(cached);
        setAccountReady(true);
      }
    }
    try {
      const [me, account] = await Promise.all([apiFetch("/api/auth/me"), apiFetch("/api/account")]);
      if (seq !== sessionSeq.current) return null;
      if (me.user?.role === "admin") {
        signOutLocally();
        return null;
      }
      sessionCode.current = me.user.referralId;
      const mapped = mapSessionUser(me.user);
      setSessionUser(mapped);
      localStorage.setItem(USER_KEY, JSON.stringify(me.user));
      applyAccount(account.account);
      setAccountReady(true);
      loadExtras(seq);
      return mapped;
    } catch (error) {
      if (seq === sessionSeq.current) {
        if (error.status === 401) signOutLocally();
        else setSessionError(error.message || "Could not load your account.");
      }
      throw error;
    }
  };

  const startSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem("addflix_impersonating");
    sessionCode.current = "";
    return refreshSession(user);
  };

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) refreshSession().catch(() => {});
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
          silent: true,
        });
        if (stopped) return;
        applyLive(data);
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

  const offDayMessage = () => `${roiDay?.weekday || "Today"} is an ROI off day for your plan. No task or ROI today${roiDay?.resumesOn ? ` — it resumes on ${roiDay.resumesOn}` : ""}.`;

  const startTask = () => {
    if (roiDay?.allOff && !roiClaimed) {
      toast(offDayMessage(), "info");
      return;
    }
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
      silent: true,
    });
    applyLive(data);
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
    if (roiDay?.allOff) {
      toast(offDayMessage(), "info");
      return { ok: false, reason: "off" };
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
    signOutLocally();
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
      roiDay,
      tasks,
      notes,
      unreadCount,
      depositRows,
      withdrawalRows,
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
      startSession,
      accountReady,
      sessionError,
      logout,
      loginHistory,
      sessionUser,
      walletAddress,
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
      roiDay,
      tasks,
      notes,
      unreadCount,
      depositRows,
      withdrawalRows,
      toasts,
      modal,
      sessionUser,
      accountReady,
      sessionError,
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
