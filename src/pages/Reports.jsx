import { Link } from "react-router-dom";
import Pager, { usePaging } from "@/components/common/Pager";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useApp } from "@/context/AppContext";
import { money, signedUsd } from "@/lib/utils";
import { formatLedgerDate, liveIncome } from "@/lib/ledger";
import AppIcon from "@/components/common/AppIcon";

const kinds = {
  roi: {
    title: "AdView Report",
    subtitle: "Daily AdView credited after you claim the task.",
    icon: "HandCoins",
  },
  investment: {
    title: "Investment Report",
    icon: "Landmark",
    subtitle: "Active and completed plans on this account.",
  },
  referral: {
    title: "Referral Report",
    icon: "Users",
    subtitle: "4-level subscription commission.",
  },
  income: {
    title: "Income Report",
    icon: "BadgeDollarSign",
    subtitle: "AdView, referral, bonus and other credits.",
  },
  wallet: {
    title: "Wallet Statement",
    icon: "Wallet",
    subtitle: "Deposits, withdrawals and wallet credits.",
  },
  subscription: {
    title: "Subscription Report",
    icon: "CreditCard",
    subtitle: "Your $10 USDT ID activation.",
  },
  team: {
    title: "Team Report",
    icon: "Users",
    subtitle: "Direct and downline members on your sponsor tree.",
  },
  deposit: {
    title: "Deposit Report",
    icon: "ArrowDownToLine",
    subtitle: "USDT received on BEP-20 and other networks.",
  },
  withdrawal: {
    title: "Withdrawal Report",
    icon: "ArrowUpFromLine",
    subtitle: "Payout requests, 10% fee, pending review.",
  },
};

export default function Reports({ kind }) {
  const { income, transactions, depositRows, withdrawalRows, subscriptionPayments, investments, network, referralCredits } = useApp();
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

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title={meta.title} subtitle={meta.subtitle} crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Reports", to: "/reports" }, { label: meta.title }]} />
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
          {statement.items.map((row) => {
            if (kind === "roi") {
              const date = row.cells[rows.columns.indexOf("Date")];
              const amount = row.cells[rows.columns.indexOf("Amount")];
              return (
                <article key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fafc] px-3 py-3">
                  <p className="min-w-0 text-sm text-[#667085]">{date}</p>
                  <p className="shrink-0 text-sm font-bold text-emerald-600">{amount}</p>
                </article>
              );
            }
            return (
              <article key={row.id} className="rounded-xl bg-[#f8fafc] p-3">
                <dl className="space-y-2">
                  {rows.columns.map((column, index) => {
                    const value = row.cells[index];
                    if (value == null || value === "") return null;
                    const moneyCol = /amount|commission|fee|receive|earned/i.test(column);
                    return (
                      <div key={column} className="flex items-start justify-between gap-3">
                        <dt className="shrink-0 text-xs font-medium text-[#667085]">{column}</dt>
                        <dd className={`min-w-0 break-words text-right text-sm ${moneyCol ? "font-bold text-emerald-600" : "font-medium text-[#101828]"}`}>
                          {value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </article>
            );
          })}
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
        cells: [row.date, String(row.type).replaceAll("ROI Income", "AdView income").replaceAll("ROI", "AdView"), signedUsd(row.amount), <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
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
    const rows = depositRows || [];
    return {
      columns: ["Date", "TX", "Network", "Amount", "Status"],
      items: rows.map((row) => ({
        id: row.id,
        cells: [row.date, row.tx, row.network, `$${money(row.amount)}`, <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
      })),
    };
  }
  if (kind === "withdrawal") {
    const rows = withdrawalRows || [];
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
      cells: [formatLedgerDate(row.date), String(row.type).replaceAll("ROI Income", "AdView income").replaceAll("ROI", "AdView income"), String(row.description).replaceAll("ROI", "AdView income"), signedUsd(row.amount), <StatusBadge key={row.id} tone={row.status}>{row.status}</StatusBadge>],
    })),
  };
}
