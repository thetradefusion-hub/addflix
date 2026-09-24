import { Link, Navigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";

const pages = {
  about: {
    title: "About Us",
    body: [
      "ADD FLIX is a watch-promote-earn platform. Members activate an ID with a $10 USDT subscription, invite a 4-level team, and earn daily ROI after completing a short video or ad task.",
      "This demo is frontend-only. Payments, blockchain confirmation and admin review are simulated.",
    ],
  },
  "how-it-works": {
    title: "How It Works",
    body: [
      "1. Register and enter a sponsor ID.",
      "2. Pay $10 USDT on BEP-20 to activate your ID.",
      "3. Choose an investment plan. Daily ROI is based on that plan.",
      "4. Open Claim ROI, watch the assigned video to 95%, then claim. Credit lands in your wallet.",
      "5. Share your referral link. Level 1 earns 20% of $10 ($2). Levels 2–4 earn $1.50, $1.00 and $0.50.",
    ],
  },
  "subscription-details": {
    title: "Subscription Details",
    body: [
      "Price: $10 USDT. Network: BEP-20 (BSC). One activation per ID in this model.",
      "Until the subscription is Active, daily task, ROI claim, new investment and withdrawal stay locked. Deposit remains open so you can pay.",
      "Status values: Not Active, Pending, Active, Failed.",
    ],
  },
  "earning-rules": {
    title: "Earning Rules",
    body: [
      "Daily ROI requires the assigned task. Required watch is 95%. Claim is manual.",
      "A missed day is not carried forward unless a later business rule says otherwise.",
      "ROI stops when the plan cap is reached. Withdrawal minimum is $10 USDT with a 10% fee.",
    ],
  },
  faq: {
    title: "FAQ",
    body: [
      "Do I need the $10 subscription? Yes. Earning features stay locked until the ID is Active.",
      "Can I skip the daily video? Then today's ROI stays locked and the day is Missed.",
      "When is withdrawal paid? After admin review. This demo records Pending only.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "This interface is a product demo. It does not hold real USDT or execute on-chain transfers.",
      "Users must complete tasks honestly. Multiple accounts, skipping video, or sharing sessions can void ROI.",
      "ADD FLIX may pause features for maintenance or compliance.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "The demo stores profile edits in this browser session only.",
      "A live product would keep name, mobile, email, sponsor ID, wallet address and task logs to run payouts.",
      "You can request account closure from Support once the backend is live.",
    ],
  },
  disclaimer: {
    title: "Disclaimer & Risk Disclosure",
    body: [
      "ROI is not guaranteed. Completing a task does not create a promise of profit on real funds.",
      "Crypto transfers on BEP-20 are irreversible. Send only USDT on the stated network.",
      "This is not investment, legal or tax advice.",
    ],
  },
  contact: {
    title: "Contact Us",
    body: [
      "Support hours: 10:00–19:00 IST, Monday to Saturday.",
      "Open a ticket from Support, or use  support@addflix.demo  in the live product.",
      "For this demo, tickets stay on this device.",
    ],
  },
};

export const legalLinks = Object.entries(pages).map(([slug, item]) => ({ slug, title: item.title }));

export default function Legal() {
  const { slug } = useParams();
  const page = pages[slug];
  if (!page) return <Navigate to="/legal/about" replace />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={page.title} subtitle="ADD FLIX information pages for the revised earning model." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Legal" }, { label: page.title }]} />
      <article className="rounded-2xl border border-[#eaecf0] bg-white p-5">
        <div className="space-y-3 text-sm leading-6 text-[#475467]">
          {page.body.map((para) => <p key={para}>{para}</p>)}
        </div>
      </article>
      <nav className="mt-4 flex flex-wrap gap-2">
        {legalLinks.map((item) => (
          <Link key={item.slug} to={`/legal/${item.slug}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${item.slug === slug ? "bg-[#111827] text-white" : "bg-white text-[#475467]"}`}>
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
