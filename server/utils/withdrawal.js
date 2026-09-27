export const MIN_WITHDRAW = 10;
export const WITHDRAW_FEE_RATE = 0.1;
export const BEP20_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export function money2(value) {
  return Number(Number(value).toFixed(2));
}

export function quoteWithdrawal(amount, feeRate = WITHDRAW_FEE_RATE) {
  const value = money2(amount);
  const fee = money2(value * feeRate);
  return { amount: value, fee, receive: money2(value - fee) };
}

function openWithdrawal(account, withdrawalId) {
  const row = (account.withdrawals || []).find((item) => String(item.id) === String(withdrawalId));
  if (!row || (row.status !== "Pending" && row.status !== "Processing")) {
    const error = new Error("Pending withdrawal not found.");
    error.status = 404;
    throw error;
  }
  return row;
}

function reservedAmount(row) {
  if (!row.sources) return 0;
  return money2(["bonus", "referral", "roi"].reduce((sum, key) => sum + Number(row.sources[key] || 0), 0));
}

export function approveWithdrawal(account, withdrawalId, txHash) {
  const row = openWithdrawal(account, withdrawalId);
  row.status = "Completed";
  row.tx = txHash;
  row.reviewedAt = new Date().toISOString();
  if (reservedAmount(row) > 0) {
    account.balances.total = money2(account.balances.total - row.amount);
    account.balances.locked = money2(Math.max(0, account.balances.locked - row.amount));
  }
  const ledger = (account.transactions || []).find((item) => String(item.withdrawalId) === String(row.id));
  if (ledger) {
    ledger.status = "Success";
    ledger.tx = txHash;
  }
  return row;
}

export function rejectWithdrawal(account, withdrawalId, note = "") {
  const row = openWithdrawal(account, withdrawalId);
  row.status = "Rejected";
  row.note = note;
  row.reviewedAt = new Date().toISOString();
  if (reservedAmount(row) > 0) {
    account.balances.locked = money2(Math.max(0, account.balances.locked - row.amount));
    for (const key of ["bonus", "referral", "roi"]) {
      account.balances[key] = money2(Number(account.balances[key] || 0) + Number(row.sources[key] || 0));
    }
  }
  const ledger = (account.transactions || []).find((item) => String(item.withdrawalId) === String(row.id));
  if (ledger) ledger.status = "Failed";
  return row;
}

export function availableBalance(balances) {
  return money2(Math.max(0, Number(balances?.total || 0) - Number(balances?.locked || 0)));
}

export function lockFunds(balances, amount) {
  let left = money2(amount);
  const sources = { bonus: 0, referral: 0, roi: 0 };
  for (const key of ["bonus", "referral", "roi"]) {
    const have = money2(balances[key] || 0);
    const take = money2(Math.min(have, left));
    balances[key] = money2(have - take);
    sources[key] = take;
    left = money2(left - take);
  }
  balances.locked = money2(Number(balances.locked || 0) + amount);
  return sources;
}
