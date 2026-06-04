import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import {
  getCategoryBreakdown,
  getMonthlySpend,
  type InsightsFilters,
} from "@/lib/expenses/insights";
import { getExpenseSyncStatus } from "@/lib/sync/expenses";
import { isExpenseSyncInProgress } from "@/lib/sync/lock";

export type DashboardSummary = {
  currency: string;
  thisMonth: {
    total: string;
    expenseCount: number;
    dateFrom: string;
    dateTo: string;
  };
  lastMonth: {
    total: string;
    expenseCount: number;
  };
  delta: number;
  deltaPct: number | null;
  topCategories: Array<{
    categoryId: number | null;
    categoryName: string;
    total: string;
    count: number;
  }>;
  monthlySparkline: Array<{
    month: string;
    total: string;
    count: number;
  }>;
  sync: {
    status: string;
    lastSyncAt: string | null;
    expenseCount: number;
    error: string | null;
    inProgress: boolean;
  };
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function thisMonthRange(now = new Date()) {
  return {
    dateFrom: startOfMonth(now).toISOString(),
    dateTo: now.toISOString(),
  };
}

export function lastMonthRange(now = new Date()) {
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    dateFrom: startOfMonth(last).toISOString(),
    dateTo: endOfMonth(last).toISOString(),
  };
}

function sparklineRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    dateFrom: start.toISOString(),
    dateTo: now.toISOString(),
  };
}

function filtersWithCurrency(
  range: { dateFrom: string; dateTo: string },
  currency: string,
): InsightsFilters {
  return {
    ...range,
    currency,
    excludePayments: true,
  };
}

function sumForCurrency(
  rows: Array<{
    month: string;
    currency: string;
    total: string;
    count: number;
  }>,
  currency: string,
  month?: string,
): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (const row of rows) {
    if (row.currency !== currency) continue;
    if (month != null && row.month !== month) continue;
    total += Number(row.total);
    count += row.count;
  }
  return { total, count };
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function lastSixMonthKeys(now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return null;

  const now = new Date();
  const currency = owner.defaultCurrency;
  const thisRange = thisMonthRange(now);
  const lastRange = lastMonthRange(now);
  const sparkRange = sparklineRange(now);
  const thisMonthKey = monthKey(now);
  const lastMonthKey = monthKey(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );

  const [thisMonthly, lastMonthly, sparkMonthly, topCategories, sync] =
    await Promise.all([
      getMonthlySpend(filtersWithCurrency(thisRange, currency)),
      getMonthlySpend(filtersWithCurrency(lastRange, currency)),
      getMonthlySpend(filtersWithCurrency(sparkRange, currency)),
      getCategoryBreakdown(filtersWithCurrency(thisRange, currency), 3),
      getExpenseSyncStatus(owner.id),
    ]);

  const thisMonthTotals = sumForCurrency(thisMonthly, currency, thisMonthKey);
  const lastMonthTotals = sumForCurrency(lastMonthly, currency, lastMonthKey);

  const delta = thisMonthTotals.total - lastMonthTotals.total;
  const deltaPct =
    lastMonthTotals.total === 0
      ? thisMonthTotals.total === 0
        ? 0
        : null
      : (delta / lastMonthTotals.total) * 100;

  const monthlySparkline = lastSixMonthKeys(now).map((month) => {
    const { total, count } = sumForCurrency(sparkMonthly, currency, month);
    return {
      month,
      total: String(total),
      count,
    };
  });

  return {
    currency,
    thisMonth: {
      total: String(thisMonthTotals.total),
      expenseCount: thisMonthTotals.count,
      dateFrom: thisRange.dateFrom,
      dateTo: thisRange.dateTo,
    },
    lastMonth: {
      total: String(lastMonthTotals.total),
      expenseCount: lastMonthTotals.count,
    },
    delta,
    deltaPct,
    topCategories,
    monthlySparkline,
    sync: {
      status: sync.status,
      lastSyncAt: sync.lastSyncAt?.toISOString() ?? null,
      expenseCount: sync.expenseCount,
      error: sync.error,
      inProgress: isExpenseSyncInProgress(),
    },
  };
}
