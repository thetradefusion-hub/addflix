import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { deposits, investmentHistory, levelRates, referralHistory, teamMembers, withdrawals } from "@/data/mockData";
import { useApp } from "@/context/AppContext";
import { money } from "@/lib/utils";
import AppIcon from "@/components/common/AppIcon";

const kinds = {
  roi: {
    title: "ROI Report",
    subtitle: "Daily ROI credits from the Standard Plan.",
    icon: "HandCoins",
    stats: [
      ["Total ROI", "$312.50"],
      ["Today", "$2.50"],
      ["Plan cap", "$500.00"],
      ["Progress", "62.5%"],
    ],
  },
  investment: {
    title: "Investment Report",
    icon: "Landmark",
    subtitle: "Active and completed plans on this account.",
    stats: [
      ["Invested", "$100.00"],
      ["Active plan", "Standard"],
      ["Daily ROI", "2.5%"],
      ["Earned", "$312.50"],
    ],
  },
  referral: {
    title: "Referral Report",
    icon: "Users",
    subtitle: "4-level subscription commission.",
    stats: [
      ["Referral income", "$180.00"],
      ["Direct", "24"],
      ["Team", "126"],
      ["Active", "94"],
    ],
  },
  income: {
    title: "Income Report",
    icon: "BadgeDollarSign",
    subtitle: "ROI, referral, bonus and other credits.",
    stats: [
      ["Total income", "$542.50"],
      ["ROI", "$312.50"],
      ["Referral", "$180.00"],
      ["Bonus + other", "$50.00"],
    ],
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
    subtitle: "Direct and downline members in this demo.",
    stats: [
      ["Team", "126"],
      ["Active", "94"],
      ["Direct", "24"],
      ["Listed here", "10"],
    ],
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
  const { income, transactions, balances, toast, depositRows, withdrawalRows } = useApp();
  const meta = kinds[kind];

  if (!meta) {
    return (
      <div className="mx-auto max-w-[1180px]">
        <PageHeader title="Reports" subtitle="Pick a statement. Each report uses the same demo account." crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Reports" }]} />
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

  const rows = buildRows(kind, income, transactions, depositRows, withdrawalRows);
  const chart = kind === "referral"
    ? levelRates.map((item) => ({ name: `L${item.level}`, value: item.members }))
    : [
        { name: "ROI", value: 312.5 },
        { name: "Referral", value: 180 },
        { name: "Bonus", value: 35 },
        { name: "Other", value: 15 },
      ];

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title={meta.title} subtitle={meta.subtitle} crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Reports", to: "/reports" }, { label: meta.title }]} />
      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {meta.stats.map(([label, value]) => (
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
          <button className="text-xs font-semibold text-[#e10600]" onClick={() => toast(`${meta.title} export is ready in this demo.`, "info")}>Export</button>
        </div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#667085]">
              <tr>{rows.columns.map((column) => <th key={column} className="pb-2 font-medium">{column}</th>)}</tr>
            </thead>
            <tbody>
              {rows.items.map((row) => (
                <tr key={row.id} className="border-t border-[#f2f4f7]">
                  {row.cells.map((cell, index) => <td key={index} className="py-3">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 lg:hidden">
          {rows.items.map((row) => (
            <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
              <p className="font-semibold">{row.cells[1]}</p>
              <p className="text-xs text-[#667085]">{row.cells[0]}</p>
              <p className="mt-1 text-sm font-bold text-emerald-600">{row.cells[2]}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildRows(kind, income, transactions, depositRows, withdrawalRows) {
  if (kind === "investment") {
    return {
      columns: ["Plan", "Amount", "Start", "Earned", "Status"],
      items: investmentHistory.map((row) => ({
        id: row.id,
        cells: [row.plan, `$${money(row.amount)}`, row.startDate, `$${money(row.earnedRoi)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "referral") {
    return {
      columns: ["Date", "User", "Level", "Commission", "Status"],
      items: referralHistory.map((row) => ({
        id: row.id,
        cells: [row.date, row.user, `Level ${row.level}`, `$${money(row.commission)}`, <StatusBadge key={row.id} tone="credited">{row.status}</StatusBadge>],
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
      items: [{ id: "sub-1", cells: ["24 Sep 2026", "$10.00", "BEP-20", "0x3A7F...D0e1", <StatusBadge key="s" tone="success">Success</StatusBadge>] }],
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
    items: source.slice(0, 12).map((row) => ({
      id: row.id,
      cells: [row.date, row.type, row.description, `+${money(row.amount)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
    })),
  };
}
