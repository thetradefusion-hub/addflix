import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";

const pages = {
  about: {
    title: "About Us",
    intro: "ADD FLIX is a Watch • Promote • Earn member platform. You enjoy entertainment, share your referral link, and take part in a clear earning structure from one account.",
    sections: [
      {
        heading: "What we offer",
        paragraphs: [
          "Members activate an ID with a one-time USDT subscription on BEP-20 (BSC), complete a short daily video task to unlock AdView, and can invest in plans that pay daily ROI up to a defined cap.",
          "The platform also supports a 4-level subscription referral tree, direct investment referral, optional signup rewards, and a unilevel salary plan based on team investment volume.",
        ],
      },
      {
        heading: "Our approach",
        bullets: [
          "Simple member journey: register, activate, watch, promote, earn.",
          "Transparent rules inside your account and on these information pages.",
          "USDT activity on BEP-20 with admin review for deposits, subscriptions and withdrawals.",
          "Support tickets for help during staffed hours.",
        ],
      },
      {
        heading: "Important note",
        paragraphs: [
          "Rewards follow the live rules configured by the platform. They are not automatic guarantees of profit. Always read Earning Rules, Terms and the Risk Disclosure before you participate.",
        ],
      },
    ],
  },
  "how-it-works": {
    title: "How It Works",
    intro: "Five steps take you from registration to daily earning and team growth.",
    sections: [
      {
        heading: "1. Create your account",
        paragraphs: [
          "Register with a valid sponsor / referral ID. Complete OTP verification (demo code may apply in test environments). Accept the Terms and Privacy Policy to continue.",
        ],
      },
      {
        heading: "2. Activate your ID",
        paragraphs: [
          "Pay the subscription amount in USDT on BEP-20 (BSC) to the platform deposit address, then submit your transaction hash. Your ID stays inactive until an admin marks the payment Success.",
          "Until activation, daily task, AdView claim, new investment and withdrawals stay locked. Deposits remain available so you can fund activation.",
        ],
      },
      {
        heading: "3. Invest in a plan (optional)",
        paragraphs: [
          "Choose an active investment plan and amount (subject to the plan minimum). Daily AdView / ROI is based on that plan and stops when the plan cap is reached.",
        ],
      },
      {
        heading: "4. Complete the daily task and claim",
        paragraphs: [
          "Open the daily task, watch the assigned video to the required percentage (typically 95%), mark the task complete, then claim today’s AdView. Credit is added to your wallet when the claim succeeds.",
        ],
      },
      {
        heading: "5. Share and grow",
        paragraphs: [
          "Share your personal referral link. When someone joins and activates, subscription referral commissions follow the level rates in Settings (Levels 1–4). When a direct referral invests, you may receive a percentage of that investment if your ID is active.",
          "Team genealogy, income reports and salary progress are available inside your member area.",
        ],
      },
    ],
  },
  "subscription-details": {
    title: "Subscription Details",
    intro: "The subscription is a one-time account activation fee paid in USDT. It unlocks earning features for that member ID.",
    sections: [
      {
        heading: "Key facts",
        bullets: [
          "Amount: as shown on the Subscription page (default $10 USDT).",
          "Network: BEP-20 (BSC) only. Do not send from ERC-20, TRC-20 or other networks.",
          "Plan type: Account activation.",
          "Validity: Lifetime for that ID once approved.",
          "One successful activation per ID in the standard model.",
        ],
      },
      {
        heading: "Status meanings",
        bullets: [
          "Not Active — payment not yet approved; earning features locked.",
          "Pending — hash submitted; waiting for admin review.",
          "Active — ID unlocked for daily task, AdView, investment and withdrawals.",
          "Failed — payment rejected; submit a new valid transaction hash.",
        ],
      },
      {
        heading: "What unlocks after activation",
        bullets: [
          "Daily sponsored video task",
          "AdView / ROI claim",
          "Investment plans",
          "Referral income (when rules are met)",
          "Withdrawals and member transfers (subject to wallet rules)",
        ],
      },
      {
        heading: "Payment tips",
        paragraphs: [
          "Send exactly the stated amount to the platform address shown in your account. After payment, paste the correct transaction hash and wait for verification. Wrong network or wrong amount can delay or fail activation.",
        ],
      },
    ],
  },
  "earning-rules": {
    title: "Earning Rules",
    intro: "These rules describe how credits are earned on ADD FLIX. Live rates and percentages are controlled in Admin Settings and may change.",
    sections: [
      {
        heading: "Daily AdView / ROI",
        bullets: [
          "Requires an active subscription and an eligible investment plan where applicable.",
          "Complete the assigned daily video task to the required watch percentage, then claim manually.",
          "A missed day is not carried forward unless a later rule says otherwise.",
          "ROI stops when the plan’s earning cap is reached.",
        ],
      },
      {
        heading: "Subscription referral (Levels 1–4)",
        bullets: [
          "Paid when a downline activates their $10-style subscription (admin approved).",
          "Level amounts follow platform settings (for example Level 1 may be $2 of a $10 activation).",
          "Your own ID must be active to receive subscription referral credit.",
        ],
      },
      {
        heading: "Investment direct referral",
        bullets: [
          "When a member you referred directly invests in a package, you may receive a percentage of that investment amount (default 5%).",
          "Only the immediate (Level 1) sponsor is paid. Deeper levels are not included in this rule.",
          "Your ID must be active. The percentage is set under Admin → Settings → Investment direct referral %.",
        ],
      },
      {
        heading: "Signup bonus & signup referral",
        bullets: [
          "If enabled, a signup bonus may credit the new member’s wallet once at registration.",
          "A share of that bonus may credit the direct sponsor (signup referral %).",
          "Withdrawing / transferring remaining signup bonus and signup referral may require unlock based on a percentage of your direct referral business (active subscription + investments). ROI and other incomes are not limited by that gate.",
        ],
      },
      {
        heading: "Salary plan",
        bullets: [
          "Unilevel team investment volume (BV) can unlock salary ranks defined by admin.",
          "Daily salary, tenure and claim rules follow the Salary Plan screen and admin rank table.",
        ],
      },
      {
        heading: "Withdrawals",
        bullets: [
          "Minimum withdrawal and fee rate follow Settings (commonly $10 minimum and a percentage fee).",
          "Requests stay Pending until admin approval. Locked funds return if a request is rejected.",
          "Send only to a valid BEP-20 wallet address you control.",
        ],
      },
      {
        heading: "Fair use",
        paragraphs: [
          "Skipping required video time, using bots, multi-accounting, or abusing referrals can void credits and may lead to account action. Completing a task does not guarantee profit on real funds.",
        ],
      },
    ],
  },
  faq: {
    title: "FAQ",
    intro: "Short answers to common questions. For full detail, open the matching legal page or contact Support.",
    faqs: [
      {
        q: "What is ADD FLIX?",
        a: "A Watch • Promote • Earn member platform. You activate an ID, complete daily tasks for AdView, share referrals, and optionally invest in plans.",
      },
      {
        q: "Do I need the subscription?",
        a: "Yes. Daily task, AdView claim, new investment and withdrawals stay locked until your ID is Active after admin approval of the USDT payment.",
      },
      {
        q: "Which network should I use?",
        a: "USDT on BEP-20 (BSC) only. Transfers on other networks cannot be recovered by the platform.",
      },
      {
        q: "Can I skip the daily video?",
        a: "If you do not reach the required watch percentage and claim, today’s AdView stays locked and the day may show as missed.",
      },
      {
        q: "How do 4-level referrals work?",
        a: "When someone activates with a sponsor chain, Levels 1–4 can receive the fixed subscription commissions from Settings. Only active IDs are paid.",
      },
      {
        q: "What is investment referral?",
        a: "Your direct referrals’ package investments can pay you a set percentage of the invested amount (default 5%). Admin can change that rate.",
      },
      {
        q: "When is a withdrawal paid?",
        a: "After you submit a request it stays Pending until finance/admin review. Approved payouts are completed with a transaction hash; rejected ones unlock your balance.",
      },
      {
        q: "Where do I get help?",
        a: "Open a ticket from Support inside the app. Staffed hours are listed on Contact Us.",
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "By creating an ADD FLIX account or using the platform, you agree to these Terms. If you do not agree, do not use the service.",
    sections: [
      {
        heading: "Eligibility & account",
        paragraphs: [
          "You must provide accurate registration details and keep your login, OTP and transaction PIN confidential. You are responsible for activity under your ID.",
          "One person should not operate multiple accounts to manipulate referrals, tasks or rewards. The platform may suspend or close accounts that breach these Terms.",
        ],
      },
      {
        heading: "Subscription, plans & tasks",
        paragraphs: [
          "Subscription activation, investment plans, daily tasks and claims follow the rules shown in the app and on the Earning Rules page. Admin may update rates, fees and plan availability.",
          "You must complete video tasks honestly. Skipping, automation, shared sessions or forged transaction hashes can void AdView and related credits.",
        ],
      },
      {
        heading: "Payments & crypto",
        paragraphs: [
          "USDT transfers on BEP-20 are irreversible. Send only the stated asset on the stated network to the address shown in your account. The platform is not responsible for funds sent incorrectly.",
          "Deposits, subscriptions and withdrawals may require admin verification. Pending does not mean paid.",
        ],
      },
      {
        heading: "Referrals & promotions",
        paragraphs: [
          "Referral and bonus credits are discretionary products of the published rules. They are not wages, interest products or guaranteed returns.",
        ],
      },
      {
        heading: "Service changes",
        paragraphs: [
          "ADD FLIX may update features, pause maintenance windows, or change these Terms. Continued use after an update means you accept the revised Terms.",
        ],
      },
      {
        heading: "Limitation",
        paragraphs: [
          "To the fullest extent allowed by law, ADD FLIX is not liable for indirect or consequential losses arising from use of the platform, network fees, user error or third-party blockchain behaviour.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "This Policy explains what information ADD FLIX uses to run member accounts, tasks and payouts.",
    sections: [
      {
        heading: "Information we use",
        bullets: [
          "Identity and contact: name, username, email, mobile, referral / sponsor IDs.",
          "Security: passwords, OTP flows, transaction PIN (stored for verification).",
          "Wallet & finance: BEP-20 payout address, balances, deposits, withdrawals, investments, income logs.",
          "Activity: daily task progress, notifications, support tickets, device/session signals used for fraud review.",
        ],
      },
      {
        heading: "How we use it",
        bullets: [
          "Create and secure your account",
          "Process subscription, investment, referral and salary credits",
          "Review deposits and withdrawals",
          "Provide support and platform notices",
          "Improve safety and prevent abuse",
        ],
      },
      {
        heading: "Sharing",
        paragraphs: [
          "We do not sell your personal data. Information may be processed by infrastructure providers (hosting, database, email/SMS gateways if enabled) solely to operate the service. Admin staff can see member records required for review.",
        ],
      },
      {
        heading: "Retention & requests",
        paragraphs: [
          "We keep records as long as needed for account operation, audit and dispute handling. You may request correction of profile data from Profile / Support. Account closure requests are handled through Support once verified.",
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "We use access controls and encrypted transport where the live product is deployed. No method of transmission is perfectly secure; protect your PIN and never share OTP codes.",
        ],
      },
    ],
  },
  disclaimer: {
    title: "Disclaimer & Risk Disclosure",
    intro: "Please read this carefully before sending USDT or relying on any earning feature.",
    sections: [
      {
        heading: "No profit guarantee",
        paragraphs: [
          "AdView, referral credits, investment ROI, salary and bonuses are subject to rules, caps, admin settings and your own activity. Completing a task or inviting others does not create a promise of profit.",
        ],
      },
      {
        heading: "Crypto & network risk",
        paragraphs: [
          "Digital assets are volatile and transfers on public blockchains are irreversible. Wrong network, wrong address or phishing can cause permanent loss. ADD FLIX cannot reverse a mistaken on-chain transfer.",
        ],
      },
      {
        heading: "Not advice",
        paragraphs: [
          "Nothing on ADD FLIX is investment, legal, accounting or tax advice. You are solely responsible for compliance with laws that apply to you.",
        ],
      },
      {
        heading: "Platform status",
        paragraphs: [
          "Features may be demo, limited or under review depending on environment. Always verify deposit addresses inside your logged-in account before sending funds.",
        ],
      },
      {
        heading: "Your responsibility",
        bullets: [
          "Use only wallets you control",
          "Double-check amounts and network",
          "Keep credentials private",
          "Read Earning Rules and Terms before participating",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Us",
    intro: "We are here to help with activation, tasks, wallet questions and account issues.",
    sections: [
      {
        heading: "Support channels",
        bullets: [
          "In-app: open Support and create a ticket (fastest for logged-in members).",
          "Email: support@addflix.demo (replace with your live support address in production).",
        ],
      },
      {
        heading: "Staffed hours",
        paragraphs: [
          "10:00–19:00 IST, Monday to Saturday. Tickets received outside these hours are handled on the next staffed day.",
        ],
      },
      {
        heading: "Before you write",
        bullets: [
          "Include your Member ID (referral ID)",
          "Describe the issue and the page URL",
          "Attach the transaction hash for payment questions",
          "Never share your password, OTP or transaction PIN",
        ],
      },
      {
        heading: "Response",
        paragraphs: [
          "We aim to reply within one staffed business day. Complex wallet reviews may take longer while an admin verifies on-chain details.",
        ],
      },
    ],
  },
};

export const legalLinks = Object.entries(pages).map(([slug, item]) => ({ slug, title: item.title }));

function ParagraphBlock({ paragraphs = [] }) {
  return paragraphs.map((para) => (
    <p key={para} className="text-sm leading-6 text-[#475467]">{para}</p>
  ));
}

function BulletBlock({ bullets = [] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#475467]">
      {bullets.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function isHeadingLine(line, index, lines) {
  if (!line || line.startsWith("•") || line.startsWith("-")) return false;
  if (/^\d+\.\s/.test(line)) return true;
  if (line.length > 80) return false;
  if (line.endsWith("?")) return true;
  const next = lines[index + 1];
  if (!next) return false;
  return next.startsWith("•") || next.startsWith("-") || next.length > 40;
}

function CmsBody({ lines = [] }) {
  const nodes = [];
  let bullets = [];
  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(<BulletBlock key={`b-${nodes.length}`} bullets={bullets.map((item) => item.replace(/^[•\-]\s*/, ""))} />);
    bullets = [];
  };

  lines.forEach((line, index) => {
    const text = String(line || "").trim();
    if (!text) return;
    if (text.startsWith("•") || text.startsWith("-")) {
      bullets.push(text);
      return;
    }
    flushBullets();
    if (isHeadingLine(text, index, lines)) {
      nodes.push(<h2 key={`h-${nodes.length}`} className="pt-1 text-base font-bold text-[#101828]">{text}</h2>);
      return;
    }
    nodes.push(<p key={`p-${nodes.length}`} className="text-sm leading-6 text-[#475467]">{text}</p>);
  });
  flushBullets();
  return <div className="space-y-3">{nodes}</div>;
}

function PageBody({ page }) {
  if (Array.isArray(page.body) && page.body.length && !page.sections && !page.faqs) {
    return <CmsBody lines={page.body} />;
  }

  return (
    <div className="space-y-5">
      {page.intro ? <p className="text-sm leading-6 text-[#475467]">{page.intro}</p> : null}
      {(page.sections || []).map((section) => (
        <section key={section.heading || section.paragraphs?.[0]}>
          {section.heading ? <h2 className="mb-2 text-base font-bold text-[#101828]">{section.heading}</h2> : null}
          {section.paragraphs?.length ? <div className="space-y-2"><ParagraphBlock paragraphs={section.paragraphs} /></div> : null}
          {section.bullets?.length ? <div className={section.paragraphs?.length ? "mt-2" : ""}><BulletBlock bullets={section.bullets} /></div> : null}
        </section>
      ))}
      {page.faqs?.length ? (
        <div className="space-y-4">
          {page.faqs.map((item) => (
            <section key={item.q} className="rounded-xl bg-[#f8fafc] p-3.5">
              <h2 className="text-sm font-bold text-[#101828]">{item.q}</h2>
              <p className="mt-1.5 text-sm leading-6 text-[#475467]">{item.a}</p>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Legal() {
  const { slug } = useParams();
  const fallback = pages[slug];
  const [page, setPage] = useState(fallback);
  useEffect(() => {
    setPage(fallback);
    if (!fallback) return;
    fetch(`/api/cms/${slug}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.page?.title) setPage(data.page);
      })
      .catch(() => {});
  }, [slug]);
  if (!fallback) return <Navigate to="/legal/about" replace />;
  if (!page) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={page.title} subtitle="ADD FLIX information pages." crumbs={[{ label: "Home", to: "/" }, { label: page.title }]} />
      <article className="rounded-2xl border border-[#eaecf0] bg-white p-5 sm:p-6">
        <PageBody page={page} />
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
