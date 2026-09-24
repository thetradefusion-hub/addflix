export const user = {
  name: "Rahul Kumar",
  id: "ADF12568",
  email: "rahul.kumar@example.com",
  phone: "+91 98765 43210",
  country: "India",
  joined: "15 Jul 2025",
  language: "English",
};

export const walletAddress = "0x3A7F9D8e4B2c1F6d5E8a9B0c3D4eF6A7b8C9D0e1";

export const referralLink = "https://addflix.demo/ref/ADF12568";

export const subscriptionPackage = {
  amount: 10,
  network: "BEP-20",
  networkLabel: "BEP-20 (BSC)",
  planType: "Account Activation",
  validity: "Lifetime",
  activationDate: "24 Sep 2026",
};

export const plans = [
  {
    id: "starter",
    name: "Starter Plan",
    min: 100,
    dailyRoi: 2,
    maxRoi: 150,
    validity: 75,
    taskRequired: true,
    multiple: true,
    accent: "blue",
    popular: false,
  },
  {
    id: "standard",
    name: "Standard Plan",
    min: 100,
    dailyRoi: 2.5,
    maxRoi: 200,
    validity: 80,
    taskRequired: true,
    multiple: true,
    accent: "red",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium Plan",
    min: 1000,
    dailyRoi: 3,
    maxRoi: 250,
    validity: 90,
    taskRequired: true,
    multiple: true,
    accent: "purple",
    popular: false,
  },
  {
    id: "vip",
    name: "VIP Plan",
    min: 2000,
    dailyRoi: 3.5,
    maxRoi: 300,
    validity: 100,
    taskRequired: true,
    multiple: true,
    accent: "amber",
    popular: false,
  },
];

export const activeInvestment = {
  id: "INV-1008",
  planId: "standard",
  plan: "Standard Plan",
  amount: 100,
  dailyRoiPercent: 2.5,
  dailyRoi: 2.5,
  totalRoi: 312.5,
  cap: 500,
  status: "Active",
  startDate: "15 Jul 2025",
  validityDays: 80,
};

export const investmentHistory = [
  {
    id: 1,
    plan: "Standard Plan",
    amount: 100,
    startDate: "15 Jul 2025",
    dailyRoi: "2.5%",
    totalRoi: 500,
    earnedRoi: 312.5,
    status: "Active",
  },
  {
    id: 2,
    plan: "Starter Plan",
    amount: 100,
    startDate: "10 Jun 2025",
    dailyRoi: "2%",
    totalRoi: 150,
    earnedRoi: 150,
    status: "Completed",
  },
];

export const levelRates = [
  { level: 1, label: "Level 1 (Direct)", rate: "20%", amount: 2, members: 24, active: 20 },
  { level: 2, label: "Level 2", rate: "", amount: 1.5, members: 38, active: 30 },
  { level: 3, label: "Level 3", rate: "", amount: 1, members: 36, active: 26 },
  { level: 4, label: "Level 4", rate: "", amount: 0.5, members: 28, active: 18 },
];

export const teamMembers = [
  { id: "ADF26891", name: "Amit Sharma", level: 1, joined: "24 Jul 2026", status: "Active", investment: 100, parent: "ADF12568", sponsor: "ADF12568", plan: "Standard", tasks: 18 },
  { id: "ADF26990", name: "Neha Verma", level: 1, joined: "23 Jul 2026", status: "Active", investment: 100, parent: "ADF12568", sponsor: "ADF12568", plan: "Standard", tasks: 16 },
  { id: "ADF26880", name: "Kavita Joshi", level: 1, joined: "19 Jul 2026", status: "Active", investment: 1000, parent: "ADF12568", sponsor: "ADF12568", plan: "Premium", tasks: 20 },
  { id: "ADF26889", name: "Suresh Patel", level: 2, joined: "22 Jul 2026", status: "Active", investment: 500, parent: "ADF26891", sponsor: "ADF26891", plan: "Standard", tasks: 12 },
  { id: "ADF26888", name: "Pooja Singh", level: 2, joined: "21 Jul 2026", status: "Inactive", investment: 0, parent: "ADF26891", sponsor: "ADF26891", plan: "—", tasks: 0 },
  { id: "ADF26861", name: "Meera Nair", level: 2, joined: "15 Jul 2026", status: "Active", investment: 2000, parent: "ADF26990", sponsor: "ADF26990", plan: "VIP", tasks: 21 },
  { id: "ADF26887", name: "Rohan Mehta", level: 3, joined: "20 Jul 2026", status: "Active", investment: 100, parent: "ADF26889", sponsor: "ADF26889", plan: "Starter", tasks: 9 },
  { id: "ADF26876", name: "Imran Khan", level: 3, joined: "18 Jul 2026", status: "Active", investment: 100, parent: "ADF26889", sponsor: "ADF26889", plan: "Standard", tasks: 11 },
  { id: "ADF26870", name: "Anjali Rao", level: 4, joined: "17 Jul 2026", status: "Active", investment: 100, parent: "ADF26887", sponsor: "ADF26887", plan: "Starter", tasks: 8 },
  { id: "ADF26866", name: "Vikram Das", level: 4, joined: "16 Jul 2026", status: "Inactive", investment: 0, parent: "ADF26876", sponsor: "ADF26876", plan: "—", tasks: 1 },
];

export const roiCalendar = Array.from({ length: 25 }, (_, i) => {
  const day = i + 1;
  if (day === 25) return { day, status: "Pending", task: "0%", claim: "Locked", roi: 2.5 };
  if (day === 23) return { day, status: "Missed", task: "40%", claim: "Not Claimed", roi: 2.5 };
  if (day === 9) return { day, status: "Expired", task: "0%", claim: "Expired", roi: 2.5 };
  return { day, status: "Claimed", task: "100%", claim: "Claimed", roi: 2.5 };
});

export const loginHistory = [
  { id: 1, device: "Chrome · Windows 10", ip: "103.211.xx.14", location: "Delhi, IN", time: "25 Sep 2026, 02:10 AM", current: true },
  { id: 2, device: "Safari · iPhone", ip: "49.36.xx.8", location: "Delhi, IN", time: "24 Sep 2026, 08:42 PM", current: false },
  { id: 3, device: "Chrome · Android", ip: "106.219.xx.3", location: "Noida, IN", time: "22 Sep 2026, 11:05 AM", current: false },
];

export const referralHistory = [
  { id: 1, date: "24 Jul 2026, 10:25 AM", user: "ADF26891", level: 1, amount: 10, commission: 2, status: "Credited", tx: "TX4587...9AD1" },
  { id: 2, date: "23 Jul 2026, 05:14 PM", user: "ADF26885", level: 2, amount: 10, commission: 1.5, status: "Credited", tx: "TX3F89...28C4" },
  { id: 3, date: "22 Jul 2026, 01:32 PM", user: "ADF26877", level: 3, amount: 10, commission: 1, status: "Credited", tx: "TX7840...8CFF" },
  { id: 4, date: "21 Jul 2026, 11:20 AM", user: "ADF26860", level: 4, amount: 10, commission: 0.5, status: "Credited", tx: "TX15B4...91AC" },
  { id: 5, date: "19 Jul 2026, 09:05 AM", user: "ADF26880", level: 1, amount: 10, commission: 2, status: "Credited", tx: "TX90C1...11AE" },
];

export const activities = [
  { id: 1, title: "Daily ROI Claimed", time: "24 Jul 2025, 10:30 AM", amount: 2.5, status: "Success", type: "roi" },
  { id: 2, title: "Video Task Completed", time: "24 Jul 2025, 10:28 AM", amount: null, status: "Completed", type: "task" },
  { id: 3, title: "Referral Commission", time: "23 Jul 2025, 04:15 PM", amount: 2, status: "Success", type: "referral" },
  { id: 4, title: "Withdrawal Request", time: "22 Jul 2025, 11:20 AM", amount: 20, status: "Under Review", type: "withdraw" },
];

export const notifications = [
  { id: 1, title: "Today's ROI is locked", body: "Watch the sponsored video to unlock 2.50 USDT.", time: "2 hours ago", unread: true },
  { id: 2, title: "Referral joined your team", body: "Amit Sharma activated with your link.", time: "Yesterday", unread: true },
  { id: 3, title: "Withdrawal update", body: "Your 20.00 USDT request is under review.", time: "22 Jul 2025", unread: true },
  { id: 4, title: "Subscription active", body: "Your 10 USDT account was activated on 24 Sep 2026.", time: "24 Sep 2026", unread: false },
  { id: 5, title: "Daily task reminder", body: "Complete today's 2 minute video before midnight.", time: "Today", unread: false },
];

export const taskHistory = [
  { id: 1, date: "24 Jul 2026", title: "Watch Sponsored Video", duration: "2 Minutes", completion: "100%", status: "Completed", roi: 2.5, claim: "Claimed" },
  { id: 2, date: "23 Jul 2026", title: "Brand Promo Ad", duration: "2 Minutes", completion: "40%", status: "Missed", roi: 2.5, claim: "Not Claimed" },
  { id: 3, date: "22 Jul 2026", title: "Watch Sponsored Video", duration: "2 Minutes", completion: "100%", status: "Completed", roi: 2.5, claim: "Claimed" },
  { id: 4, date: "21 Jul 2026", title: "AutoX Electric Cars", duration: "2 Minutes", completion: "100%", status: "Completed", roi: 2.5, claim: "Claimed" },
];

export const walletTransactions = [
  { id: 1, date: "24 Jul 2026, 10:30 AM", type: "ROI Credit", amount: 2.5, status: "Success", direction: "credit" },
  { id: 2, date: "23 Jul 2026, 04:15 PM", type: "Referral Income", amount: 2, status: "Success", direction: "credit" },
  { id: 3, date: "22 Jul 2026, 11:20 AM", type: "Withdrawal", amount: -20, status: "Pending", direction: "debit" },
  { id: 4, date: "21 Jul 2026, 03:40 PM", type: "Deposit", amount: 50, status: "Success", direction: "credit" },
  { id: 5, date: "21 Jul 2026, 01:15 PM", type: "Transfer", amount: -5, status: "Success", direction: "debit" },
  { id: 6, date: "20 Jul 2026, 09:10 AM", type: "Bonus", amount: 0.5, status: "Success", direction: "credit" },
];

export const deposits = [
  { id: 1, date: "28 Sep 2026, 10:24 AM", tx: "0x4587...9AD1", network: "BEP-20", amount: 50, status: "Success" },
  { id: 2, date: "25 Sep 2026, 03:18 PM", tx: "0x3F89...28C4", network: "BEP-20", amount: 100, status: "Success" },
  { id: 3, date: "20 Sep 2026, 11:45 AM", tx: "0x7812...D4AE", network: "TRC-20", amount: 30, status: "Pending" },
  { id: 4, date: "16 Sep 2026, 09:10 PM", tx: "0x6621...21DA", network: "BEP-20", amount: 100, status: "Success" },
  { id: 5, date: "15 Sep 2026, 01:32 PM", tx: "0x9021...38CF", network: "ERC-20", amount: 25, status: "Success" },
];

export const withdrawals = [
  { id: 1, date: "27 Sep 2026, 04:12 PM", tx: "0x4587...9AD1", amount: 20, fee: 2, receive: 18, status: "Success", address: "0x91ab...22c1" },
  { id: 2, date: "25 Sep 2026, 12:05 PM", tx: "0x3892...BC4A", amount: 15, fee: 1.5, receive: 13.5, status: "Success", address: "0x44de...90aa" },
  { id: 3, date: "19 Sep 2026, 08:30 PM", tx: "0x6642...E44B", amount: 50, fee: 5, receive: 45, status: "Processing", address: "0x12ff...7710" },
  { id: 4, date: "14 Sep 2026, 10:20 AM", tx: "0x0345...CC78", amount: 50, fee: 5, receive: 45, status: "Success", address: "0x77aa...10b2" },
  { id: 5, date: "10 Sep 2026, 02:15 PM", tx: "0x2211...AB12", amount: 20, fee: 2, receive: 18, status: "Failed", address: "0x09cc...4419" },
];

export const incomeSeed = [
  { id: 1, date: "30 Sep 2026, 08:15 AM", type: "ROI Income", description: "Daily ROI (Standard Plan)", amount: 2.5, status: "Credited", tx: "TX4587...9AD1" },
  { id: 2, date: "30 Sep 2026, 07:40 AM", type: "Referral Income", description: "Level 1 Subscription", amount: 2, status: "Credited", tx: "TX3892...BC4A" },
  { id: 3, date: "29 Sep 2026, 08:15 AM", type: "ROI Income", description: "Daily ROI (Standard Plan)", amount: 2.5, status: "Credited", tx: "TX7812...D4AE" },
  { id: 4, date: "29 Sep 2026, 06:30 PM", type: "Bonus Income", description: "Task Completion Bonus", amount: 0.5, status: "Credited", tx: "TX6621...21DA" },
  { id: 5, date: "28 Sep 2026, 04:10 PM", type: "Referral Income", description: "Level 2 Subscription", amount: 1.5, status: "Credited", tx: "TX9021...38CF" },
  { id: 6, date: "27 Sep 2026, 08:15 AM", type: "ROI Income", description: "Daily ROI (Standard Plan)", amount: 2.5, status: "Credited", tx: "TX1422...9EF1" },
  { id: 7, date: "26 Sep 2026, 02:22 PM", type: "Referral Income", description: "Level 3 Subscription", amount: 1, status: "Credited", tx: "TX7816...AB12" },
  { id: 8, date: "25 Sep 2026, 04:02 PM", type: "Other Income", description: "Special Reward", amount: 1.5, status: "Credited", tx: "TX6642...E44B" },
  { id: 9, date: "24 Sep 2026, 08:15 AM", type: "ROI Income", description: "Daily ROI (Standard Plan)", amount: 2.5, status: "Credited", tx: "TX3881...D29E" },
  { id: 10, date: "23 Sep 2026, 11:18 AM", type: "Referral Income", description: "Level 4 Subscription", amount: 0.5, status: "Credited", tx: "TX6964...E44B" },
  { id: 11, date: "22 Sep 2026, 08:15 AM", type: "ROI Income", description: "Daily ROI (Standard Plan)", amount: 2.5, status: "Credited", tx: "TX2201...AA10" },
  { id: 12, date: "21 Sep 2026, 09:40 AM", type: "Bonus Income", description: "Video Streak Bonus", amount: 0.5, status: "Credited", tx: "TX1180...CC21" },
  { id: 13, date: "20 Sep 2026, 06:12 PM", type: "Other Income", description: "Promotional Credit", amount: 2, status: "Pending", tx: "TX0091...BB77" },
  { id: 14, date: "19 Sep 2026, 08:15 AM", type: "ROI Income", description: "Daily ROI (Standard Plan)", amount: 2.5, status: "Credited", tx: "TX7712...90AD" },
  { id: 15, date: "18 Sep 2026, 01:05 PM", type: "Referral Income", description: "Level 1 Subscription", amount: 2, status: "Credited", tx: "TX4410...17CE" },
  { id: 16, date: "17 Sep 2026, 08:15 AM", type: "ROI Income", description: "Daily ROI (Standard Plan)", amount: 2.5, status: "Credited", tx: "TX3308...65FA" },
];

export const incomeChart = [
  { day: "01 Sep", roi: 12, referral: 6, bonus: 1, other: 0.5 },
  { day: "05 Sep", roi: 14, referral: 8, bonus: 1.2, other: 0.4 },
  { day: "10 Sep", roi: 16, referral: 7, bonus: 1.5, other: 0.8 },
  { day: "15 Sep", roi: 18, referral: 11, bonus: 2, other: 0.6 },
  { day: "20 Sep", roi: 20, referral: 9, bonus: 1.8, other: 1 },
  { day: "25 Sep", roi: 22, referral: 12, bonus: 2.2, other: 0.9 },
  { day: "30 Sep", roi: 24, referral: 10, bonus: 2.4, other: 1.1 },
];

export const earningBars = [
  { day: "18 Jul", roi: 18, referral: 12, other: 6 },
  { day: "19 Jul", roi: 22, referral: 8, other: 4 },
  { day: "20 Jul", roi: 16, referral: 14, other: 7 },
  { day: "21 Jul", roi: 28, referral: 10, other: 5 },
  { day: "22 Jul", roi: 20, referral: 16, other: 8 },
  { day: "23 Jul", roi: 26, referral: 11, other: 6 },
  { day: "24 Jul", roi: 24, referral: 15, other: 9 },
];

export const videos = [
  { id: "v1", title: "What is Bitcoin? | Complete Guide", category: "Crypto", duration: "02:35", seconds: 155, reward: 0.25, tone: "amber" },
  { id: "v2", title: "How to Trade Safely in Crypto", category: "Crypto", duration: "03:12", seconds: 192, reward: 0.3, tone: "rose" },
  { id: "v3", title: "Secure Your Crypto Wallet", category: "Technology", duration: "01:58", seconds: 118, reward: 0.2, tone: "blue" },
  { id: "v4", title: "Top 5 Altcoins in 2026", category: "Crypto", duration: "04:21", seconds: 261, reward: 0.4, tone: "violet" },
  { id: "v5", title: "Metaverse Explained in 5 Minutes", category: "Technology", duration: "02:50", seconds: 170, reward: 0.25, tone: "indigo" },
  { id: "v6", title: "Earn Passive Income with Staking", category: "Business", duration: "03:44", seconds: 224, reward: 0.35, tone: "amber" },
  { id: "v7", title: "Web3 Future Opportunities", category: "Business", duration: "04:10", seconds: 250, reward: 0.35, tone: "cyan" },
  { id: "v8", title: "Crypto Safety Tips for Beginners", category: "Education", duration: "02:18", seconds: 138, reward: 0.2, tone: "emerald" },
  { id: "v9", title: "Health Habits for Traders", category: "Health", duration: "02:05", seconds: 125, reward: 0.15, tone: "teal" },
  { id: "v10", title: "Build a Business with Referrals", category: "Business", duration: "03:28", seconds: 208, reward: 0.3, tone: "red" },
];

export const videoEarnings = [
  { id: 1, title: "How to Trade Safely in Crypto", amount: 0.3, date: "24 Sep, 10:35 AM" },
  { id: 2, title: "What is Bitcoin?", amount: 0.25, date: "24 Sep, 10:28 AM" },
  { id: 3, title: "Secure Your Wallet", amount: 0.2, date: "23 Sep, 09:50 AM" },
  { id: 4, title: "Top 5 Altcoins", amount: 0.4, date: "23 Sep, 09:12 AM" },
  { id: 5, title: "Metaverse Explained", amount: 0.35, date: "22 Sep, 08:45 AM" },
];

export const supportTickets = [
  {
    id: "TK-2041",
    subject: "Withdrawal still pending",
    status: "Open",
    updated: "25 Sep 2026",
    messages: [
      { from: "You", time: "25 Sep 2026, 09:12 AM", body: "My 20 USDT withdrawal is still under review. Please check." },
      { from: "Support", time: "25 Sep 2026, 11:40 AM", body: "We are verifying the BEP-20 address. This usually completes within 24 hours." },
    ],
  },
  {
    id: "TK-1988",
    subject: "Video task did not credit",
    status: "Resolved",
    updated: "18 Sep 2026",
    messages: [
      { from: "You", time: "18 Sep 2026, 10:02 AM", body: "I watched the full video but ROI stayed locked." },
      { from: "Support", time: "18 Sep 2026, 01:18 PM", body: "The session dropped at 88%. Replay the task and keep the tab in focus until 95%." },
      { from: "You", time: "18 Sep 2026, 04:40 PM", body: "Completed again. Thank you." },
    ],
  },
];

export const reports = [
  { id: "RPT-09", name: "September Income Statement", period: "01 Sep 2026 – 25 Sep 2026", type: "Income" },
  { id: "RPT-08", name: "Team Performance", period: "Aug 2026", type: "Referral" },
  { id: "RPT-07", name: "Wallet Ledger", period: "Jul 2026", type: "Wallet" },
];

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { to: "/subscription", label: "My Subscription", icon: "CreditCard" },
  { to: "/investment", label: "My Plan / Investment", icon: "PieChart" },
  { to: "/daily-task", label: "Daily Task", icon: "ListChecks" },
  { to: "/roi", label: "Today's ROI", icon: "CircleDollarSign" },
  { to: "/watch", label: "Watch Videos", icon: "Play" },
  {
    label: "Income",
    icon: "DollarSign",
    children: [
      { to: "/income/roi", label: "ROI Income" },
      { to: "/income/referral", label: "Referral Income" },
      { to: "/income/bonus", label: "Bonus" },
      { to: "/income", label: "Income History" },
    ],
  },
  {
    label: "Referral",
    icon: "UserPlus",
    children: [
      { to: "/referral/link", label: "My Referral Link" },
      { to: "/referral/level/1", label: "Level 1" },
      { to: "/referral/level/2", label: "Level 2" },
      { to: "/referral/level/3", label: "Level 3" },
      { to: "/referral/level/4", label: "Level 4" },
    ],
  },
  { to: "/team", label: "My Team", icon: "Users" },
  {
    label: "Wallet",
    icon: "Wallet",
    children: [
      { to: "/wallet", label: "Balance" },
      { to: "/wallet/deposit", label: "Deposit" },
      { to: "/wallet/withdraw", label: "Withdraw" },
      { to: "/wallet/transactions", label: "Transactions" },
    ],
  },
  {
    label: "Reports",
    icon: "FileBarChart",
    children: [
      { to: "/reports/roi", label: "ROI Report" },
      { to: "/reports/investment", label: "Investment Report" },
      { to: "/reports/referral", label: "Referral Report" },
      { to: "/reports/income", label: "Income Report" },
      { to: "/reports/wallet", label: "Wallet Statement" },
      { to: "/reports/subscription", label: "Subscription Report" },
      { to: "/reports/team", label: "Team Report" },
      { to: "/reports/deposit", label: "Deposit Report" },
      { to: "/reports/withdrawal", label: "Withdrawal Report" },
    ],
  },
  { to: "/notifications", label: "Notifications", icon: "Bell", badge: 3 },
  { to: "/support", label: "Support", icon: "Headphones" },
  { to: "/profile", label: "Profile & Settings", icon: "UserRound" },
];

export const searchPages = [
  ...navItems.flatMap((item) =>
    item.children ? item.children.map((child) => ({ label: `${item.label} · ${child.label}`, to: child.to })) : [{ label: item.label, to: item.to }]
  ),
  { label: "About Us", to: "/legal/about" },
  { label: "How It Works", to: "/legal/how-it-works" },
  { label: "Terms & Conditions", to: "/legal/terms" },
  { label: "Privacy Policy", to: "/legal/privacy" },
  { label: "FAQ", to: "/legal/faq" },
];
