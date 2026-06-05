import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import {
  getCategoryBreakdown,
  getMonthlySpend,
  getGroupSummary,
  type InsightsFilters,
} from "@/lib/expenses/insights";
import { listExpenses } from "@/lib/expenses/queries";
import type { ExpenseListItem } from "@/lib/expenses/types";
import { getExpenseSyncStatus } from "@/lib/sync/expenses";
import { isAnySyncInProgress } from "@/lib/sync/lock";
import { isSyncActive } from "@/lib/sync/active";
import {
  getLiveBalanceSummary,
  type BalanceSummary,
} from "@/lib/splitwise/balances";
import { formatMoney } from "@/lib/format";

export type DynamicInsight = {
  id: string;
  headline: string;
  detail: string;
  href?: string;
  tone: "neutral" | "spend" | "balance" | "alert";
};

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
  topGroups: Array<{
    groupId: number;
    groupName: string;
    expenseCount: number;
    myShareTotal: string;
    percentOfTotal: number;
  }>;
  monthlySparkline: Array<{
    month: string;
    total: string;
    count: number;
  }>;
  balances: BalanceSummary | null;
  insights: DynamicInsight[];
  recentExpenses: ExpenseListItem[];
  projectedMonthTotal: number | null;
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

async function getBiggestExpenseThisMonth(
  accountUserId: number,
  ownerSplitwiseId: number,
  range: { dateFrom: string; dateTo: string },
  currency: string,
): Promise<{ description: string; cost: string; splitwiseId: number } | null> {
  const db = getDb();
  const row = await db
    .select({
      description: schema.expenses.description,
      cost: schema.expenseShares.owedShare,
      splitwiseId: schema.expenses.splitwiseId,
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, ownerSplitwiseId),
      ),
    )
    .where(
      and(
        eq(schema.expenses.accountUserId, accountUserId),
        isNull(schema.expenses.deletedAt),
        eq(schema.expenses.payment, false),
        eq(schema.expenses.currencyCode, currency),
        gte(schema.expenses.date, new Date(range.dateFrom)),
        lte(schema.expenses.date, new Date(range.dateTo)),
      ),
    )
    .orderBy(desc(schema.expenseShares.owedShare))
    .limit(1);

  return row[0] ?? null;
}

function buildDynamicInsights(input: {
  currency: string;
  thisTotal: number;
  lastTotal: number;
  deltaPct: number | null;
  topCategories: DashboardSummary["topCategories"];
  topGroup: {
    groupId: number;
    groupName: string;
    expenseCount: number;
    myShareTotal: string;
  } | null;
  biggestExpense: { description: string; cost: string } | null;
  balances: BalanceSummary | null;
  now: Date;
}): DynamicInsight[] {
  const insights: DynamicInsight[] = [];
  const { currency } = input;
  const fmt = (amount: number) => formatMoney(amount, currency);

  if (input.deltaPct != null && Math.abs(input.deltaPct) >= 5) {
    const up = input.deltaPct > 0;
    insights.push({
      id: "spend-trend",
      headline: up ? "Spending is up this month" : "You're spending less",
      detail: `${up ? "+" : ""}${input.deltaPct.toFixed(0)}% vs last month (${fmt(input.thisTotal)} so far).`,
      href: "/insights",
      tone: up ? "alert" : "spend",
    });
  }

  const topCat = input.topCategories[0];
  if (topCat) {
    insights.push({
      id: "top-category",
      headline: `${topCat.categoryName} leads this month`,
      detail: `${fmt(Number(topCat.total))} across ${topCat.count} expense${topCat.count === 1 ? "" : "s"}.`,
      href: `/explore?category=${topCat.categoryId ?? ""}`,
      tone: "spend",
    });
  }

  if (input.biggestExpense) {
    insights.push({
      id: "biggest-expense",
      headline: "Largest expense so far",
      detail: `${input.biggestExpense.description} — ${fmt(Number(input.biggestExpense.cost))}`,
      tone: "neutral",
    });
  }

  if (input.topGroup && input.topGroup.expenseCount > 0) {
    insights.push({
      id: "top-group",
      headline: `Most active: ${input.topGroup.groupName}`,
      detail: `${input.topGroup.expenseCount} expenses, ${fmt(Number(input.topGroup.myShareTotal))} your share.`,
      href: `/explore?group=${input.topGroup.groupId}`,
      tone: "neutral",
    });
  }

  const day = input.now.getDate();
  const daysInMonth = new Date(
    input.now.getFullYear(),
    input.now.getMonth() + 1,
    0,
  ).getDate();
  if (day >= 5 && input.thisTotal > 0) {
    const projected = (input.thisTotal / day) * daysInMonth;
    insights.push({
      id: "pace",
      headline: "Month-end pace",
      detail: `On track for ~${fmt(projected)} this month at current rate.`,
      href: "/insights",
      tone: "spend",
    });
  }

  return insights.slice(0, 3);
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

  const [
    thisMonthly,
    lastMonthly,
    sparkMonthly,
    topCategories,
    sync,
    balances,
    groups,
    biggestExpense,
    recentList,
  ] = await Promise.all([
    getMonthlySpend(filtersWithCurrency(thisRange, currency)),
    getMonthlySpend(filtersWithCurrency(lastRange, currency)),
    getMonthlySpend(filtersWithCurrency(sparkRange, currency)),
    getCategoryBreakdown(filtersWithCurrency(thisRange, currency), 3),
    getExpenseSyncStatus(owner.id),
    getLiveBalanceSummary(currency).catch(() => null),
    getGroupSummary(filtersWithCurrency(thisRange, currency)),
    getBiggestExpenseThisMonth(
      owner.id,
      owner.splitwiseId,
      thisRange,
      currency,
    ),
    listExpenses({
      ...filtersWithCurrency(thisRange, currency),
      sort: "date",
      order: "desc",
      page: 1,
      pageSize: 10,
    }),
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

  const topGroup = groups[0] ?? null;
  const day = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const projectedMonthTotal =
    day >= 3 && thisMonthTotals.total > 0
      ? (thisMonthTotals.total / day) * daysInMonth
      : null;

  const insights = buildDynamicInsights({
    currency,
    thisTotal: thisMonthTotals.total,
    lastTotal: lastMonthTotals.total,
    deltaPct,
    topCategories,
    topGroup: topGroup
      ? {
          groupId: topGroup.groupId,
          groupName: topGroup.groupName,
          expenseCount: topGroup.expenseCount,
          myShareTotal: topGroup.myShareTotal,
        }
      : null,
    biggestExpense: biggestExpense
      ? { description: biggestExpense.description, cost: biggestExpense.cost }
      : null,
    balances,
    now,
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
    topGroups: groups.filter((g) => g.groupId > 0).slice(0, 5),
    balances,
    insights,
    recentExpenses: recentList.items,
    projectedMonthTotal,
    sync: {
      status: sync.status,
      lastSyncAt: sync.lastSyncAt?.toISOString() ?? null,
      expenseCount: sync.expenseCount,
      error: sync.error,
      inProgress: isSyncActive({
        lockHeld: isAnySyncInProgress(owner.id),
        expensesStatus: sync.status,
        progress: sync.progress,
      }),
    },
  };
}
