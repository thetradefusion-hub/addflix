import { Link } from "react-router-dom";
import Pager, { usePaging } from "@/components/common/Pager";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { deposits, withdrawals } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { activationLabel, money } from "@/lib/utils";
import { formatLedgerDate, lifetimeFigures, liveIncome } from "@/lib/ledger";
import AppIcon from "@/components/common/AppIcon";

const kinds = {
  roi: {
    title: "ROI Report",
    subtitle: "Daily ROI credited after you claim the task.",
    icon: "HandCoins",
    stats: [],
  },
  investment: {
    title: "Investment Report",
    icon: "Landmark",
    subtitle: "Active and completed plans on this account.",
    stats: [],
  },
  referral: {
    title: "Referral Report",
    icon: "Users",
    subtitle: "4-level subscription commission.",
    stats: [],
  },
  income: {
    title: "Income Report",
    icon: "BadgeDollarSign",
    subtitle: "ROI, referral, bonus and other credits.",
    stats: [],
  },
  wallet: {
    title: "Wallet Statement",
    icon: "Wallet",
    subtitle: "Deposits, withdrawals and wallet credits.",
    stats: [
      ["Balance", "Live"],
      ["Network", "BEP-20"],
      ["Min withdraw", "$10"],
      ["Fee", "10%"],
    ],
  },
  subscription: {
    title: "Subscription Report",
    icon: "CreditCard",
    subtitle: "Your $10 USDT ID activation.",
    stats: [
      ["Price", "$10 USDT"],
      ["Network", "BEP-20"],
      ["Status", "Active"],
      ["Date", "24 Sep 2026"],
    ],
  },
  team: {
    title: "Team Report",
    icon: "Users",
    subtitle: "Direct and downline members on your sponsor tree.",
    stats: [],
  },
  deposit: {
    title: "Deposit Report",
    icon: "ArrowDownToLine",
    subtitle: "USDT received on BEP-20 and other networks.",
    stats: [
      ["Records", "Live"],
      ["Min", "$10"],
      ["Network", "BEP-20"],
      ["Confirmations", "3–10 min"],
    ],
  },
  withdrawal: {
    title: "Withdrawal Report",
    icon: "ArrowUpFromLine",
    subtitle: "Payout requests, 10% fee, pending review.",
    stats: [
      ["Min", "$10"],
      ["Fee", "10%"],
      ["PIN", "Required"],
      ["Status", "Queued"],
    ],
  },
};

export default function Reports({ kind }) {
  const { income, transactions, balances, depositRows, withdrawalRows, subscriptionPayments, investments, todayRoi, network, referralCredits, subscriptionActive, activatedAt, subscriptionPrice } = useApp();
  const meta = kinds[kind];
  const rows = buildRows(kind, liveIncome(income), transactions, depositRows, withdrawalRows, subscriptionPayments, investments, network.members || [], referralCredits || []);
  const statement = usePaging(rows.items, 8, kind);

  if (!meta) {
    return (
      <div className="mx-auto max-w-[1180px]">
        <PageHeader title="Reports" subtitle="Statements from this account, the sponsor tree and the income ledger." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Reports" }]} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(kinds).map(([id, item]) => (
            <Link key={id} to={`/reports/${id}`} className="rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-sm hover:border-[#e10600]">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-red-50 text-[#e10600]"><AppIcon name={item.icon} size={20} /></span>
              <p className="font-bold">{item.title}</p>
              <p className="mt-1 text-sm text-[#667085]">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const earned = lifetimeFigures(balances, referralCredits, income);
  const activePlan = investments.find((row) => row.status === "Active");
  const investedTotal = investments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const earnedTotal = investments.reduce((sum, row) => sum + Number(row.earnedRoi || 0), 0);
  const liveStats = {
    roi: [
      ["Total ROI", `$${money(earned.roi)}`],
      ["Today", `$${money(todayRoi)}`],
      ["Plan cap", activePlan ? `$${money(activePlan.cap)}` : "$0.00"],
      ["Progress", activePlan && activePlan.cap ? `${Math.round((activePlan.earnedRoi / activePlan.cap) * 100)}%` : "0%"],
    ],
    investment: [
      ["Invested", `$${money(investedTotal)}`],
      ["Active plan", activePlan ? activePlan.planName.replace(" Plan", "") : "None"],
      ["Daily ROI", activePlan ? `${activePlan.dailyRate}%` : "—"],
      ["Earned", `$${money(earnedTotal)}`],
    ],
    referral: [
      ["Referral income", `$${money(earned.referral)}`],
      ["Direct", String(network.direct || 0)],
      ["Team", String(network.total || 0)],
      ["Active", String(network.active || 0)],
    ],
    income: [
      ["Total income", `$${money(earned.total)}`],
      ["ROI", `$${money(earned.roi)}`],
      ["Referral", `$${money(earned.referral)}`],
      ["Bonus + other", `$${money(earned.bonus + earned.other)}`],
    ],
    team: [
      ["Team", String(network.total || 0)],
      ["Active", String(network.active || 0)],
      ["Direct", String(network.direct || 0)],
      ["Listed here", String((network.members || []).length)],
    ],
    subscription: [
      ["Price", `$${subscriptionPrice} USDT`],
      ["Network", "BEP-20"],
      ["Status", subscriptionActive ? "Active" : "Inactive"],
      ["Date", activatedAt ? activationLabel(activatedAt) : "—"],
    ],
  };
  const reportStats = liveStats[kind] || meta.stats;
  const chart = kind === "referral" || kind === "team"
    ? (network.levels || []).map((item) => ({ name: `L${item.level}`, value: item.members }))
    : [
        { name: "ROI", value: earned.roi },
        { name: "Referral", value: earned.referral },
        { name: "Bonus", value: earned.bonus },
        { name: "Other", value: earned.other },
      ];

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title={meta.title} subtitle={meta.subtitle} crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Reports", to: "/reports" }, { label: meta.title }]} />
      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {reportStats.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-[#eaecf0] bg-white p-4">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[#e10600]"><AppIcon name={meta.icon} size={16} /></span>
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="text-xl font-black">{label === "Balance" ? `$${money(balances.total)}` : value}</p>
          </article>
        ))}
      </section>
      <section className="mb-4 rounded-2xl border border-[#eaecf0] bg-white p-4">
        <p className="mb-2 font-bold">{kind === "referral" ? "Members by level" : "Income mix"}</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#e10600" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-2xl border border-[#eaecf0] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold">Statement</p>
          <button className="text-xs font-semibold text-[#e10600]" onClick={() => downloadCsv(meta.title, rows)}>Export CSV</button>
        </div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]">
              <tr>{rows.columns.map((column) => <th key={column} className="pb-2 font-medium">{column}</th>)}</tr>
            </thead>
            <tbody>
              {statement.items.map((row) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  {row.cells.map((cell, index) => <td key={index} className="py-3">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 lg:hidden">
          {statement.items.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
              <p className="font-semibold">{row.cells[1]}</p>
              <p className="text-xs text-[#667085]">{row.cells[0]}</p>
              <p className="mt-1 text-sm font-bold text-emerald-600">{row.cells[2]}</p>
            </article>
          ))}
        </div>
        {statement.total === 0 ? <p className="py-6 text-center text-sm text-[#98a2b3]">No rows in this statement.</p> : null}
        <Pager page={statement.page} pages={statement.pages} total={statement.total} size={statement.size} onChange={statement.setPage} />
      </section>
    </div>
  );
}

function downloadCsv(title, rows) {
  const lines = [
    rows.columns.map(csvCell).join(","),
    ...rows.items.map((row) => row.cells.map((cell) => csvCell(cellText(cell))).join(",")),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function cellText(cell) {
  if (cell == null || typeof cell === "boolean") return "";
  if (typeof cell === "string" || typeof cell === "number") return String(cell);
  if (Array.isArray(cell)) return cell.map(cellText).join(" ");
  if (cell.props?.children != null) return cellText(cell.props.children);
  return "";
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildRows(kind, income, transactions, depositRows, withdrawalRows, subscriptionPayments = [], investments = [], teamMembers = [], referralHistory = []) {
  if (kind === "investment") {
    return {
      columns: ["Plan", "Amount", "Start", "Earned", "Status"],
      items: investments.map((row) => ({
        id: row.id,
        cells: [row.planName, `$${money(row.amount)}`, row.startDate, `$${money(row.earnedRoi)} / $${money(row.cap)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "referral") {
    return {
      columns: ["Date", "User", "Level", "Commission", "Status"],
      items: referralHistory.map((row) => ({
        id: row.id,
        cells: [formatLedgerDate(row.date), row.user, `Level ${row.level}`, `$${money(row.commission)}`, <StatusBadge key={row.id} tone="credited">{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "wallet") {
    return {
      columns: ["Date", "Type", "Amount", "Status"],
      items: transactions.map((row) => ({
        id: row.id,
        cells: [row.date, row.type, `${row.amount > 0 ? "+" : ""}${money(row.amount)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "subscription") {
    return {
      columns: ["Date", "Amount", "Network", "TX", "Status"],
      items: (subscriptionPayments.length ? subscriptionPayments : []).map((row) => ({
        id: row.id,
        cells: [row.verifiedAt || row.submittedAt, `$${Number(row.amount).toFixed(2)}`, row.network, row.txHash, <StatusBadge key={row.id} tone={row.status === "Success" ? "success" : row.status === "Failed" ? "danger" : "pending"}>{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "team") {
    return {
      columns: ["User ID", "Name", "Level", "Plan", "Status"],
      items: teamMembers.map((row) => ({
        id: row.id,
        cells: [row.id, row.name, `Level ${row.level}`, row.plan, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "deposit") {
    const rows = depositRows?.length ? depositRows : deposits;
    return {
      columns: ["Date", "TX", "Network", "Amount", "Status"],
      items: rows.map((row) => ({
        id: row.id,
        cells: [row.date, row.tx, row.network, `$${money(row.amount)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "withdrawal") {
    const rows = withdrawalRows?.length ? withdrawalRows : withdrawals;
    return {
      columns: ["Date", "Amount", "Fee", "Receive", "Status"],
      items: rows.map((row) => ({
        id: row.id,
        cells: [row.date, `$${money(row.amount)}`, `$${money(row.fee)}`, `$${money(row.receive)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
      })),
    };
  }
  const source = kind === "roi" ? income.filter((row) => row.type === "ROI Income") : income;
  return {
    columns: ["Date", "Type", "Description", "Amount", "Status"],
    items: source.map((row) => ({
      id: row.id,
      cells: [formatLedgerDate(row.date), row.type, row.description, `+${money(row.amount)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
    })),
  };
}
