import { and, count, eq, isNull, max, sql, sum } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import { buildExpenseWhere } from "@/lib/expenses/queries";

export type InsightsFilters = Pick<
  ExpenseFilters,
  "dateFrom" | "dateTo" | "groupId" | "currency"
> & {
  excludePayments?: boolean;
};

/** Scope totals to the connected account's Splitwise default currency. */
export async function normalizeInsightsFilters<T extends InsightsFilters>(
  filters: T,
): Promise<T> {
  if (filters.currency) return filters;
  const owner = await getAuthenticatedAccountOwner();
  if (!owner?.defaultCurrency) return filters;
  return { ...filters, currency: owner.defaultCurrency };
}

function baseWhere(
  accountUserId: number,
  ownerSplitwiseId: number,
  filters: InsightsFilters,
): ReturnType<typeof buildExpenseWhere> {
  return buildExpenseWhere(accountUserId, ownerSplitwiseId, {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    groupId: filters.groupId,
    currency: filters.currency,
    payment: filters.excludePayments !== false ? false : undefined,
  });
}

export async function getMonthlySpend(
  filters: InsightsFilters,
): Promise<
  Array<{ month: string; currency: string; total: string; count: number }>
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return [];

  const db = getDb();
  const where = baseWhere(owner.id, owner.splitwiseId, filters);

  const rows = await db
    .select({
      month: sql<string>`to_char(${schema.expenses.date}, 'YYYY-MM')`,
      currency: schema.expenses.currencyCode,
      total: sum(schema.expenseShares.owedShare),
      count: count(),
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
      ),
    )
    .where(where)
    .groupBy(
      sql`to_char(${schema.expenses.date}, 'YYYY-MM')`,
      schema.expenses.currencyCode,
    )
    .orderBy(sql`to_char(${schema.expenses.date}, 'YYYY-MM')`);

  return rows.map((r) => ({
    month: r.month,
    currency: r.currency,
    total: r.total ?? "0",
    count: r.count,
  }));
}

export async function getCategoryBreakdown(
  filters: InsightsFilters,
  limit = 12,
): Promise<
  Array<{
    categoryId: number | null;
    categoryName: string;
    total: string;
    count: number;
  }>
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return [];

  const db = getDb();
  const where = baseWhere(owner.id, owner.splitwiseId, filters);

  const rows = await db
    .select({
      categoryId: schema.expenses.categoryId,
      categoryName: schema.categories.name,
      total: sum(schema.expenseShares.owedShare),
      count: count(),
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
      ),
    )
    .leftJoin(
      schema.categories,
      eq(schema.categories.splitwiseId, schema.expenses.categoryId),
    )
    .where(where)
    .groupBy(schema.expenses.categoryId, schema.categories.name)
    .orderBy(sql`sum(${schema.expenseShares.owedShare}) desc`)
    .limit(limit);

  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName:
      r.categoryName ??
      (r.categoryId ? `Category #${r.categoryId}` : "Uncategorized"),
    total: r.total ?? "0",
    count: r.count,
  }));
}

function shiftCalendarYear(date: Date, years: number): Date {
  const out = new Date(date);
  out.setFullYear(out.getFullYear() + years);
  return out;
}

export async function getRangeSummary(filters: InsightsFilters): Promise<{
  totalSpend: string;
  expenseCount: number;
  currency: string | null;
  topCategory: {
    categoryId: number | null;
    categoryName: string;
    total: string;
  } | null;
}> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return {
      totalSpend: "0",
      expenseCount: 0,
      currency: filters.currency ?? null,
      topCategory: null,
    };
  }

  const db = getDb();
  const where = baseWhere(owner.id, owner.splitwiseId, filters);

  const [agg] = await db
    .select({
      total: sum(schema.expenseShares.owedShare),
      expenseCount: count(),
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
      ),
    )
    .where(where);

  const topCats = await getCategoryBreakdown(filters, 1);
  const top = topCats[0];

  return {
    totalSpend: agg?.total ?? "0",
    expenseCount: agg?.expenseCount ?? 0,
    currency: filters.currency ?? owner.defaultCurrency,
    topCategory: top
      ? {
          categoryId: top.categoryId,
          categoryName: top.categoryName,
          total: top.total,
        }
      : null,
  };
}

export async function getPeriodComparison(
  filters: InsightsFilters,
  periodDays = 30,
): Promise<{
  currentTotal: string;
  previousTotal: string;
  yearAgoTotal: string;
  currency: string | null;
  categories: Array<{
    categoryId: number | null;
    categoryName: string;
    current: string;
    previous: string;
    yearAgo: string;
    delta: number;
    deltaPct: number | null;
    yoyDelta: number;
    yoyDeltaPct: number | null;
  }>;
}> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return {
      currentTotal: "0",
      previousTotal: "0",
      yearAgoTotal: "0",
      currency: null,
      categories: [],
    };
  }

  const end = filters.dateTo ? new Date(filters.dateTo) : new Date();
  const start = filters.dateFrom
    ? new Date(filters.dateFrom)
    : new Date(end.getTime() - periodDays * 86400000);
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - span);
  const yearAgoStart = shiftCalendarYear(start, -1);
  const yearAgoEnd = shiftCalendarYear(end, -1);

  const currentFilters: InsightsFilters = {
    ...filters,
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
  };
  const previousFilters: InsightsFilters = {
    ...filters,
    dateFrom: prevStart.toISOString(),
    dateTo: prevEnd.toISOString(),
  };
  const yearAgoFilters: InsightsFilters = {
    ...filters,
    dateFrom: yearAgoStart.toISOString(),
    dateTo: yearAgoEnd.toISOString(),
  };

  const [currentCats, previousCats, yearAgoCats] = await Promise.all([
    getCategoryBreakdown(currentFilters, 50),
    getCategoryBreakdown(previousFilters, 50),
    getCategoryBreakdown(yearAgoFilters, 50),
  ]);

  const prevMap = new Map(
    previousCats.map((c) => [c.categoryId ?? -1, Number(c.total)]),
  );
  const yearAgoMap = new Map(
    yearAgoCats.map((c) => [c.categoryId ?? -1, Number(c.total)]),
  );
  let currentTotal = 0;
  let previousTotal = 0;
  let yearAgoTotal = 0;
  for (const c of previousCats) previousTotal += Number(c.total);
  for (const c of currentCats) currentTotal += Number(c.total);
  for (const c of yearAgoCats) yearAgoTotal += Number(c.total);

  const categories = currentCats.map((c) => {
    const key = c.categoryId ?? -1;
    const cur = Number(c.total);
    const prev = prevMap.get(key) ?? 0;
    const yoy = yearAgoMap.get(key) ?? 0;
    const delta = cur - prev;
    const deltaPct = prev === 0 ? (cur === 0 ? 0 : null) : (delta / prev) * 100;
    const yoyDelta = cur - yoy;
    const yoyDeltaPct =
      yoy === 0 ? (cur === 0 ? 0 : null) : (yoyDelta / yoy) * 100;
    return {
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      current: c.total,
      previous: String(prev),
      yearAgo: String(yoy),
      delta,
      deltaPct: deltaPct === null ? null : deltaPct,
      yoyDelta,
      yoyDeltaPct: yoyDeltaPct === null ? null : yoyDeltaPct,
    };
  });

  return {
    currentTotal: String(currentTotal),
    previousTotal: String(previousTotal),
    yearAgoTotal: String(yearAgoTotal),
    currency: filters.currency ?? owner.defaultCurrency,
    categories,
  };
}

export async function getGroupSummary(filters: InsightsFilters): Promise<
  Array<{
    groupId: number;
    groupName: string;
    expenseCount: number;
    myShareTotal: string;
    percentOfTotal: number;
  }>
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return [];

  const db = getDb();
  const where = baseWhere(owner.id, owner.splitwiseId, filters);

  const rows = await db
    .select({
      groupId: schema.expenses.groupId,
      groupName: schema.groups.name,
      expenseCount: count(),
      myShareTotal: sum(schema.expenseShares.owedShare),
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
      ),
    )
    .leftJoin(
      schema.groups,
      and(
        eq(schema.groups.splitwiseId, schema.expenses.groupId),
        eq(schema.groups.accountUserId, owner.id),
      ),
    )
    .where(where)
    .groupBy(schema.expenses.groupId, schema.groups.name);

  const grand = rows.reduce((s, r) => s + Number(r.myShareTotal ?? 0), 0);
  return rows
    .map((r) => {
      const gid = r.groupId ?? 0;
      const total = Number(r.myShareTotal ?? 0);
      return {
        groupId: gid,
        groupName: gid === 0 ? "No group" : (r.groupName ?? `Group #${gid}`),
        expenseCount: r.expenseCount,
        myShareTotal: r.myShareTotal ?? "0",
        percentOfTotal: grand === 0 ? 0 : (total / grand) * 100,
      };
    })
    .sort((a, b) => Number(b.myShareTotal) - Number(a.myShareTotal));
}

export async function getFriendSummary(filters: InsightsFilters): Promise<
  Array<{
    friendId: number;
    friendName: string;
    myShareTotal: string;
    expenseCount: number;
    lastActivityAt: string | null;
  }>
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return [];

  const db = getDb();
  const where = and(
    baseWhere(owner.id, owner.splitwiseId, filters),
    isNull(schema.expenses.deletedAt),
    sql`${schema.expenses.groupId} IS NULL OR ${schema.expenses.groupId} = 0`,
  );

  const rows = await db
    .select({
      friendId: schema.expenseShares.splitwiseUserId,
      firstName: schema.friends.firstName,
      lastName: schema.friends.lastName,
      myShareTotal: sum(schema.expenseShares.owedShare),
      expenseCount: count(),
      lastActivityAt: max(schema.expenses.updatedAt),
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      eq(schema.expenseShares.expenseId, schema.expenses.id),
    )
    .leftJoin(
      schema.friends,
      and(
        eq(schema.friends.splitwiseId, schema.expenseShares.splitwiseUserId),
        eq(schema.friends.accountUserId, owner.id),
      ),
    )
    .where(
      and(
        where,
        sql`${schema.expenseShares.splitwiseUserId} <> ${owner.splitwiseId}`,
      ),
    )
    .groupBy(
      schema.expenseShares.splitwiseUserId,
      schema.friends.firstName,
      schema.friends.lastName,
    )
    .orderBy(sql`sum(${schema.expenseShares.owedShare}) desc`);

  return rows.map((r) => ({
    friendId: r.friendId,
    friendName:
      [r.firstName, r.lastName].filter(Boolean).join(" ") ||
      `User ${r.friendId}`,
    myShareTotal: r.myShareTotal ?? "0",
    expenseCount: r.expenseCount,
    lastActivityAt: r.lastActivityAt?.toISOString() ?? null,
  }));
}
