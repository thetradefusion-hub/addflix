/** Default unilevel salary ranks (admin can override in Settings). */
export const DEFAULT_SALARY_RANKS = [
  { id: 1, name: "Sales Manager", bv: 5_000, daily: 5, tenure: 100 },
  { id: 2, name: "Senior Sales Manager", bv: 25_000, daily: 25, tenure: 100 },
  { id: 3, name: "Executive", bv: 50_000, daily: 50, tenure: 100 },
  { id: 4, name: "Executive Manager", bv: 100_000, daily: 100, tenure: 100 },
  { id: 5, name: "Senior Manager", bv: 500_000, daily: 300, tenure: 100 },
  { id: 6, name: "Regional Manager", bv: 1_000_000, daily: 500, tenure: 100 },
  { id: 7, name: "Asst. General Manager", bv: 5_000_000, daily: 3_000, tenure: 100 },
  { id: 8, name: "General Manager", bv: 10_000_000, daily: 5_000, tenure: 100 },
  { id: 9, name: "Vice President", bv: 50_000_000, daily: 10_000, tenure: 100 },
  { id: 10, name: "President", bv: 100_000_000, daily: 25_000, tenure: 100 },
];

/** @deprecated use DEFAULT_SALARY_RANKS or getSalaryRanks() */
export const SALARY_RANKS = DEFAULT_SALARY_RANKS;

let ranksCache = DEFAULT_SALARY_RANKS.map((row) => ({ ...row }));

export function money2(value) {
  return Number(Number(value).toFixed(2));
}

export function emptySalary() {
  return {
    rank: 0,
    rankName: "",
    bv: 0,
    dailyAmount: 0,
    tenure: 100,
    startedDay: "",
    daysPaid: 0,
    lastPaidDay: "",
    unlockedAt: "",
  };
}

/** Validate and normalize admin-edited ranks. Sorted by BV ascending, ids reassigned 1..n. */
export function normalizeSalaryRanks(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const cleaned = list
    .map((row, index) => {
      const name = String(row?.name || "").trim();
      const bv = money2(row?.bv);
      const daily = money2(row?.daily);
      const tenure = Math.max(1, Math.round(Number(row?.tenure) || 100));
      if (!name || !(bv > 0) || !(daily >= 0)) return null;
      return { id: index + 1, name: name.slice(0, 80), bv, daily, tenure };
    })
    .filter(Boolean)
    .sort((a, b) => a.bv - b.bv || a.daily - b.daily);

  return cleaned.map((row, index) => ({ ...row, id: index + 1 }));
}

export function setSalaryRanksCache(ranks) {
  const next = normalizeSalaryRanks(ranks);
  ranksCache = next.length ? next : DEFAULT_SALARY_RANKS.map((row) => ({ ...row }));
  return ranksCache;
}

export function getSalaryRanks() {
  return ranksCache.length ? ranksCache : DEFAULT_SALARY_RANKS.map((row) => ({ ...row }));
}

export function ranksFromSettings(settings) {
  const next = normalizeSalaryRanks(settings?.salaryRanks);
  if (next.length) {
    setSalaryRanksCache(next);
    return next;
  }
  setSalaryRanksCache(DEFAULT_SALARY_RANKS);
  return getSalaryRanks();
}

export function rankForBv(bv, ranks = getSalaryRanks()) {
  const volume = Number(bv) || 0;
  let matched = null;
  for (const row of ranks) {
    if (volume >= row.bv) matched = row;
  }
  return matched;
}

export function nextRankAfter(bv, ranks = getSalaryRanks()) {
  const volume = Number(bv) || 0;
  return ranks.find((row) => volume < row.bv) || null;
}

export function presentSalary(salary, bvOverride, ranks = getSalaryRanks()) {
  const current = salary && typeof salary === "object" ? salary : emptySalary();
  const bv = bvOverride != null ? money2(bvOverride) : money2(current.bv);
  const rank = rankForBv(bv, ranks);
  const next = nextRankAfter(bv, ranks);
  const daysPaid = Number(current.daysPaid) || 0;
  const tenure = Number(current.tenure) || Number(rank?.tenure) || 100;
  const active = Boolean(rank) && daysPaid < tenure;
  return {
    ...emptySalary(),
    ...current,
    bv,
    rank: rank?.id || 0,
    rankName: rank?.name || "",
    dailyAmount: rank?.daily || 0,
    tenure,
    daysPaid,
    daysLeft: active ? Math.max(0, tenure - daysPaid) : 0,
    active,
    nextRank: next
      ? { id: next.id, name: next.name, bv: next.bv, daily: next.daily, need: money2(next.bv - bv) }
      : null,
    ranks,
  };
}
