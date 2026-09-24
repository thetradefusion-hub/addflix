import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LoadingState } from "@/components/common/EmptyState";

const AuthPage = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ROI = lazy(() => import("@/pages/ROI"));
const DailyTask = lazy(() => import("@/pages/DailyTask"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const Investment = lazy(() => import("@/pages/Investment"));
const WalletPage = lazy(() => import("@/pages/Wallet"));
const Referral = lazy(() => import("@/pages/Referral"));
const Income = lazy(() => import("@/pages/Income"));
const Transfer = lazy(() => import("@/pages/Transfer"));
const Reports = lazy(() => import("@/pages/Reports"));
const WatchVideos = lazy(() => import("@/pages/WatchVideos"));
const Legal = lazy(() => import("@/pages/Legal"));
const NotificationsPage = lazy(() => import("@/pages/Secondary").then((m) => ({ default: m.NotificationsPage })));
const SupportPage = lazy(() => import("@/pages/Secondary").then((m) => ({ default: m.SupportPage })));
const ProfilePage = lazy(() => import("@/pages/Secondary").then((m) => ({ default: m.ProfilePage })));
const NotFound = lazy(() => import("@/pages/Secondary").then((m) => ({ default: m.NotFound })));

function Page({ children }) {
  return <Suspense fallback={<LoadingState label="Loading page" />}>{children}</Suspense>;
}

function LevelRoute() {
  const { level } = useParams();
  return <Page><Referral view="level" level={Number(level) || 1} /></Page>;
}

function ReportRoute() {
  const { kind } = useParams();
  return <Page><Reports kind={kind} /></Page>;
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("addflix_token");
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Page><AuthPage /></Page>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
        <Route path="/roi" element={<Page><ROI /></Page>} />
        <Route path="/daily-task" element={<Page><DailyTask /></Page>} />
        <Route path="/subscription" element={<Page><Subscription /></Page>} />
        <Route path="/investment" element={<Page><Investment /></Page>} />
        <Route path="/wallet" element={<Page><WalletPage initialTab="Overview" /></Page>} />
        <Route path="/wallet/transactions" element={<Page><WalletPage initialTab="Transactions" /></Page>} />
        <Route path="/wallet/deposit" element={<Page><Transfer mode="Deposit" /></Page>} />
        <Route path="/wallet/withdraw" element={<Page><Transfer mode="Withdraw" /></Page>} />
        <Route path="/wallet/transfer" element={<Page><Transfer mode="Transfer" /></Page>} />
        <Route path="/referral" element={<Navigate to="/referral/link" replace />} />
        <Route path="/referral/link" element={<Page><Referral view="link" /></Page>} />
        <Route path="/referral/level/:level" element={<LevelRoute />} />
        <Route path="/team" element={<Page><Referral view="team" /></Page>} />
        <Route path="/income" element={<Page><Income preset="All Income" /></Page>} />
        <Route path="/income/roi" element={<Page><Income preset="ROI Income" /></Page>} />
        <Route path="/income/referral" element={<Page><Income preset="Referral Income" /></Page>} />
        <Route path="/income/bonus" element={<Page><Income preset="Bonus Income" /></Page>} />
        <Route path="/watch" element={<Page><WatchVideos /></Page>} />
        <Route path="/notifications" element={<Page><NotificationsPage /></Page>} />
        <Route path="/support" element={<Page><SupportPage /></Page>} />
        <Route path="/reports" element={<Page><Reports /></Page>} />
        <Route path="/reports/:kind" element={<ReportRoute />} />
        <Route path="/profile" element={<Page><ProfilePage /></Page>} />
        <Route path="/legal/:slug" element={<Page><Legal /></Page>} />
        <Route path="*" element={<Page><NotFound /></Page>} />
      </Route>
    </Routes>
  );
}
