import type { GroupDetail } from "@/lib/groups/detail";
import type { GroupListItem } from "@/lib/groups/list";
import type { DashboardSummary } from "@/lib/expenses/dashboard";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import {
  expenseShareDirection,
  matchesShareDirection,
} from "@/lib/expenses/share-direction";
import type { InsightsFilters } from "@/lib/expenses/insights";
import type { ExpenseDetail, ExpenseListItem } from "@/lib/expenses/types";
import { formatMoney } from "@/lib/format";
import {
  DEMO_BALANCES,
  DEMO_CATEGORIES,
  DEMO_FRIENDS,
  DEMO_GROUPS,
  getDemoExpenseDetail,
  getDemoExpenses,
} from "@/lib/demo/fixtures";
import type { GroupMember } from "@/lib/groups/members";
import type { FriendsBalancePage } from "@/lib/splitwise/balances";
import { DEMO_OWNER_SPLITWISE_ID, DEMO_USER } from "@/lib/demo/user";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function thisMonthRange(now = new Date()) {
  return {
    dateFrom: startOfMonth(now).toISOString(),
    dateTo: now.toISOString(),
  };
}

function lastMonthRange(now = new Date()) {
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    dateFrom: startOfMonth(last).toISOString(),
    dateTo: endOfMonth(last).toISOString(),
  };
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function inDateRange(dateIso: string, from?: string, to?: string): boolean {
  const t = new Date(dateIso).getTime();
  if (from && t < new Date(from).getTime()) return false;
  if (to && t > new Date(to).getTime()) return false;
  return true;
}

function demoExpenseDirection(
  expenseId: number,
  now = new Date(),
): ReturnType<typeof expenseShareDirection> {
  const detail = getDemoExpenseDetail(expenseId, now);
  if (!detail) return { paidByUserId: null, paidToUserId: null };
  return expenseShareDirection(detail.shares);
}

function filterDemoExpenses(
  filters: ExpenseFilters = {},
  now = new Date(),
): ExpenseListItem[] {
  let rows = getDemoExpenses(now).filter((e) => {
    if (filters.payment === true && !e.payment) return false;
    if (filters.payment === false && e.payment) return false;
    if (filters.currency && e.currencyCode !== filters.currency) return false;
    if (filters.groupId != null && e.groupId !== filters.groupId) return false;
    if (filters.categoryId != null && e.categoryId !== filters.categoryId)
      return false;
    if (!inDateRange(e.date, filters.dateFrom, filters.dateTo)) return false;
    if (filters.friendId != null) {
      const detail = getDemoExpenseDetail(e.id, now);
      const involved = detail?.shares.some(
        (s) => s.splitwiseUserId === filters.friendId,
      );
      if (!involved) return false;
    }
    if (filters.paidByUserId != null || filters.paidToUserId != null) {
      const direction = demoExpenseDirection(e.id, now);
      if (
        !matchesShareDirection(direction, {
          paidByUserId: filters.paidByUserId,
          paidToUserId: filters.paidToUserId,
        })
      ) {
        return false;
      }
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay =
        `${e.description} ${e.details ?? ""} ${e.groupName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.costMin != null && Number(e.cost) < filters.costMin)
      return false;
    if (filters.costMax != null && Number(e.cost) > filters.costMax)
      return false;
    if (filters.shareMin != null && Number(e.myShare ?? 0) < filters.shareMin)
      return false;
    if (filters.shareMax != null && Number(e.myShare ?? 0) > filters.shareMax)
      return false;
    return true;
  });

  const sort = filters.sort ?? "date";
  const order = filters.order ?? "desc";
  const dir = order === "asc" ? 1 : -1;
  rows = [...rows].sort((a, b) => {
    if (sort === "cost") {
      return (Number(a.myShare ?? 0) - Number(b.myShare ?? 0)) * dir;
    }
    if (sort === "description") {
      return a.description.localeCompare(b.description) * dir;
    }
    if (sort === "expenseDate") {
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    }
    const aUpdated = new Date(a.updatedAt ?? a.date).getTime();
    const bUpdated = new Date(b.updatedAt ?? b.date).getTime();
    return (aUpdated - bUpdated) * dir;
  });

  return rows;
}

export function demoListExpenses(
  filters: ExpenseFilters = {},
  now = new Date(),
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 100));
  const filtered = filterDemoExpenses(filters, now);
  const offset = (page - 1) * pageSize;
  return {
    items: filtered.slice(offset, offset + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export function demoExpenseSummary(
  filters: ExpenseFilters = {},
  now = new Date(),
) {
  const filtered = filterDemoExpenses(filters, now);
  const payerUserId = filters.paidByUserId ?? DEMO_OWNER_SPLITWISE_ID;
  const byCurrency = new Map<
    string,
    { myShareTotal: number; myPaidShareTotal: number; payerTotal: number }
  >();
  for (const row of filtered) {
    const entry = byCurrency.get(row.currencyCode) ?? {
      myShareTotal: 0,
      myPaidShareTotal: 0,
      payerTotal: 0,
    };
    entry.myShareTotal += Number(row.myShare ?? 0);
    entry.myPaidShareTotal += Number(row.myPaidShare ?? 0);
    const detail = getDemoExpenseDetail(row.id, now);
    const payerShare = detail?.shares.find(
      (s) => s.splitwiseUserId === payerUserId,
    );
    entry.payerTotal += Number(payerShare?.paidShare ?? 0);
    byCurrency.set(row.currencyCode, entry);
  }
  return {
    count: filtered.length,
    byCurrency: [...byCurrency.entries()].map(([currency, totals]) => ({
      currency,
      myShareTotal: String(totals.myShareTotal),
      myPaidShareTotal: String(totals.myPaidShareTotal),
      payerTotal: String(totals.payerTotal),
    })),
  };
}

export function demoExpenseDetail(
  expenseId: number,
  now = new Date(),
): ExpenseDetail | null {
  return getDemoExpenseDetail(expenseId, now);
}

export function demoExpensesForExport(
  filters: ExpenseFilters = {},
  now = new Date(),
) {
  return filterDemoExpenses(filters, now);
}

export function demoCurrentUser() {
  return DEMO_USER;
}

const DEMO_GROUP_MEMBER_MAP: Record<number, GroupMember[]> = {
  1001: [
    { id: DEMO_OWNER_SPLITWISE_ID, name: "Alex Morgan" },
    { id: 3001, name: "Jordan Lee" },
    { id: 3002, name: "Sam Patel" },
  ],
  1002: [
    { id: DEMO_OWNER_SPLITWISE_ID, name: "Alex Morgan" },
    { id: 3002, name: "Sam Patel" },
    { id: 3003, name: "Taylor Kim" },
  ],
  1003: [
    { id: DEMO_OWNER_SPLITWISE_ID, name: "Alex Morgan" },
    { id: 3001, name: "Jordan Lee" },
    { id: 3003, name: "Taylor Kim" },
  ],
};

export function demoGroupMembers(groupId: number): GroupMember[] | null {
  return DEMO_GROUP_MEMBER_MAP[groupId] ?? null;
}

export const demoCurrentUserId = DEMO_OWNER_SPLITWISE_ID;

export function demoFilterOptions() {
  return {
    ownerUserId: DEMO_OWNER_SPLITWISE_ID,
    ownerName: `${DEMO_USER.first_name} ${DEMO_USER.last_name}`.trim(),
    groups: DEMO_GROUPS.map((g) => ({ id: g.id, name: g.name })),
    friends: DEMO_FRIENDS.map((f) => ({ id: f.id, name: f.name })),
    categories: DEMO_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
    currencies: ["USD"],
  };
}

function insightsRows(filters: InsightsFilters, now = new Date()) {
  return filterDemoExpenses(
    {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      groupId: filters.groupId,
      currency: filters.currency ?? DEMO_USER.default_currency,
      payment: filters.excludePayments !== false ? false : undefined,
    },
    now,
  );
}

export function demoMonthlySpend(filters: InsightsFilters, now = new Date()) {
  const rows = insightsRows(filters, now);
  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const key = monthKey(row.date);
    const prev = map.get(key) ?? { total: 0, count: 0 };
    map.set(key, {
      total: prev.total + Number(row.myShare ?? 0),
      count: prev.count + 1,
    });
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      currency: DEMO_USER.default_currency,
      total: String(v.total),
      count: v.count,
    }));
}

export function demoCategoryBreakdown(
  filters: InsightsFilters,
  limit = 12,
  now = new Date(),
) {
  const rows = insightsRows(filters, now);
  const map = new Map<
    number | null,
    { name: string; total: number; count: number }
  >();
  for (const row of rows) {
    const key = row.categoryId;
    const prev = map.get(key) ?? {
      name: row.categoryName ?? "Uncategorized",
      total: 0,
      count: 0,
    };
    map.set(key, {
      name: prev.name,
      total: prev.total + Number(row.myShare ?? 0),
      count: prev.count + 1,
    });
  }
  return [...map.entries()]
    .map(([categoryId, v]) => ({
      categoryId,
      categoryName: v.name,
      total: String(v.total),
      count: v.count,
    }))
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, limit);
}

export function demoGroupSummary(filters: InsightsFilters, now = new Date()) {
  const rows = insightsRows(filters, now);
  const map = new Map<number, { name: string; total: number; count: number }>();
  for (const row of rows) {
    const gid = row.groupId ?? 0;
    const prev = map.get(gid) ?? { name: row.groupName, total: 0, count: 0 };
    map.set(gid, {
      name: prev.name,
      total: prev.total + Number(row.myShare ?? 0),
      count: prev.count + 1,
    });
  }
  const grand = [...map.values()].reduce((s, v) => s + v.total, 0);
  return [...map.entries()]
    .map(([groupId, v]) => ({
      groupId,
      groupName: groupId === 0 ? "No group" : v.name,
      expenseCount: v.count,
      myShareTotal: String(v.total),
      percentOfTotal: grand === 0 ? 0 : (v.total / grand) * 100,
    }))
    .sort((a, b) => Number(b.myShareTotal) - Number(a.myShareTotal));
}

export function demoFriendSummary(filters: InsightsFilters, now = new Date()) {
  const rows = insightsRows(filters, now).filter((r) => !r.groupId);
  const map = new Map<
    number,
    {
      name: string;
      total: number;
      count: number;
      lastActivityAt: string | null;
    }
  >();
  for (const row of rows) {
    const friend = DEMO_FRIENDS.find((f) =>
      row.paidBy.includes(f.name.split(" ")[0]!),
    );
    const fid = friend?.id ?? 3001;
    const prev = map.get(fid) ?? {
      name: friend?.name ?? row.paidBy,
      total: 0,
      count: 0,
      lastActivityAt: null,
    };
    const lastActivityAt =
      !prev.lastActivityAt ||
      new Date(row.updatedAt ?? row.date).getTime() >
        new Date(prev.lastActivityAt).getTime()
        ? (row.updatedAt ?? row.date)
        : prev.lastActivityAt;
    map.set(fid, {
      name: prev.name,
      total: prev.total + Number(row.myShare ?? 0),
      count: prev.count + 1,
      lastActivityAt,
    });
  }
  return [...map.entries()].map(([friendId, v]) => ({
    friendId,
    friendName: v.name,
    myShareTotal: String(v.total),
    expenseCount: v.count,
    lastActivityAt: v.lastActivityAt,
  }));
}

export function demoRangeSummary(filters: InsightsFilters, now = new Date()) {
  const rows = insightsRows(filters, now);
  const total = rows.reduce((s, r) => s + Number(r.myShare ?? 0), 0);
  const cats = demoCategoryBreakdown(filters, 1, now);
  return {
    totalSpend: String(total),
    expenseCount: rows.length,
    currency: filters.currency ?? DEMO_USER.default_currency,
    topCategory: cats[0]
      ? {
          categoryId: cats[0].categoryId,
          categoryName: cats[0].categoryName,
          total: cats[0].total,
        }
      : null,
  };
}

export function demoPeriodComparison(
  filters: InsightsFilters,
  now = new Date(),
) {
  const end = filters.dateTo ? new Date(filters.dateTo) : now;
  const start = filters.dateFrom
    ? new Date(filters.dateFrom)
    : new Date(end.getTime() - 30 * 86400000);
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - span);

  const current = demoCategoryBreakdown(
    { ...filters, dateFrom: start.toISOString(), dateTo: end.toISOString() },
    50,
    now,
  );
  const previous = demoCategoryBreakdown(
    {
      ...filters,
      dateFrom: prevStart.toISOString(),
      dateTo: prevEnd.toISOString(),
    },
    50,
    now,
  );

  const prevMap = new Map(
    previous.map((c) => [c.categoryId ?? -1, Number(c.total)]),
  );
  let currentTotal = 0;
  let previousTotal = 0;
  for (const c of current) currentTotal += Number(c.total);
  for (const c of previous) previousTotal += Number(c.total);

  const categories = current.map((c) => {
    const prev = prevMap.get(c.categoryId ?? -1) ?? 0;
    const cur = Number(c.total);
    const delta = cur - prev;
    const deltaPct = prev === 0 ? (cur === 0 ? 0 : null) : (delta / prev) * 100;
    return {
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      current: c.total,
      previous: String(prev),
      yearAgo: "0",
      delta,
      deltaPct,
      yoyDelta: cur,
      yoyDeltaPct: null,
    };
  });

  return {
    currentTotal: String(currentTotal),
    previousTotal: String(previousTotal),
    yearAgoTotal: "0",
    currency: filters.currency ?? DEMO_USER.default_currency,
    categories,
  };
}

export function demoExploreContext(now = new Date()) {
  const groups = demoGroupSummary({ excludePayments: true }, now)
    .filter((g) => g.groupId > 0)
    .slice(0, 12);
  const categories = demoCategoryBreakdown({ excludePayments: true }, 6, now);
  return { groups, topCategories: categories };
}

export function demoSyncStatus() {
  return {
    configured: true,
    connected: true,
    demo: true,
    inProgress: false,
    expenses: {
      status: "idle",
      lastSyncAt: null,
      expenseCount: getDemoExpenses().length,
      error: null,
    },
    progress: null,
    metadata: {
      groupsLastSyncAt: null,
      friendsLastSyncAt: null,
      categoriesLastSyncAt: null,
    },
  };
}

function lastSixMonthKeys(now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d.toISOString()));
  }
  return keys;
}

export function demoDashboardSummary(now = new Date()): DashboardSummary {
  const currency = DEMO_USER.default_currency;
  const thisRange = thisMonthRange(now);
  const lastRange = lastMonthRange(now);

  const thisRows = insightsRows(
    { ...thisRange, currency, excludePayments: true },
    now,
  );
  const lastRows = insightsRows(
    { ...lastRange, currency, excludePayments: true },
    now,
  );
  const sparkMonthly = demoMonthlySpend(
    {
      dateFrom: new Date(
        now.getFullYear(),
        now.getMonth() - 5,
        1,
      ).toISOString(),
      dateTo: now.toISOString(),
      currency,
      excludePayments: true,
    },
    now,
  );

  const thisTotal = thisRows.reduce((s, r) => s + Number(r.myShare ?? 0), 0);
  const lastTotal = lastRows.reduce((s, r) => s + Number(r.myShare ?? 0), 0);
  const delta = thisTotal - lastTotal;
  const deltaPct =
    lastTotal === 0 ? (thisTotal === 0 ? 0 : null) : (delta / lastTotal) * 100;

  const topCategories = demoCategoryBreakdown(
    { ...thisRange, currency, excludePayments: true },
    3,
    now,
  );
  const groups = demoGroupSummary(
    { ...thisRange, currency, excludePayments: true },
    now,
  );
  const recentList = demoListExpenses(
    {
      currency,
      payment: false,
      sort: "date",
      order: "desc",
      page: 1,
      pageSize: 10,
    },
    now,
  );

  const biggest = [...thisRows].sort(
    (a, b) => Number(b.myShare ?? 0) - Number(a.myShare ?? 0),
  )[0];

  const monthlySparkline = lastSixMonthKeys(now).map((month) => {
    const row = sparkMonthly.find((r) => r.month === month);
    return {
      month,
      total: row?.total ?? "0",
      count: row?.count ?? 0,
    };
  });

  const day = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const projectedMonthTotal =
    day >= 3 && thisTotal > 0 ? (thisTotal / day) * daysInMonth : null;

  const fmt = (n: number) => formatMoney(n, currency);
  const insights: DashboardSummary["insights"] = [];
  if (deltaPct != null && Math.abs(deltaPct) >= 5) {
    const up = deltaPct > 0;
    insights.push({
      id: "spend-trend",
      headline: up ? "Spending is up this month" : "You're spending less",
      detail: `${up ? "+" : ""}${deltaPct.toFixed(0)}% vs last month (${fmt(thisTotal)} so far).`,
      href: "/insights",
      tone: up ? "alert" : "spend",
    });
  }
  if (topCategories[0]) {
    insights.push({
      id: "top-category",
      headline: `${topCategories[0].categoryName} leads this month`,
      detail: `${fmt(Number(topCategories[0].total))} across ${topCategories[0].count} expenses.`,
      href: `/explore?category=${topCategories[0].categoryId ?? ""}`,
      tone: "spend",
    });
  }
  if (biggest) {
    insights.push({
      id: "biggest-expense",
      headline: "Largest expense so far",
      detail: `${biggest.description} — ${fmt(Number(biggest.myShare ?? 0))}`,
      tone: "neutral",
    });
  }

  return {
    currency,
    thisMonth: {
      total: String(thisTotal),
      expenseCount: thisRows.length,
      dateFrom: thisRange.dateFrom,
      dateTo: thisRange.dateTo,
    },
    lastMonth: {
      total: String(lastTotal),
      expenseCount: lastRows.length,
    },
    delta,
    deltaPct,
    topCategories,
    monthlySparkline,
    topGroups: groups.filter((g) => g.groupId > 0).slice(0, 5),
    balances: DEMO_BALANCES,
    insights: insights.slice(0, 3),
    recentExpenses: recentList.items,
    projectedMonthTotal,
    sync: {
      status: "idle",
      lastSyncAt: null,
      expenseCount: getDemoExpenses(now).length,
      error: null,
      inProgress: false,
    },
  };
}

export function demoFriendsBalancePage(): FriendsBalancePage {
  return {
    currency: DEMO_BALANCES.currency,
    summary: DEMO_BALANCES,
    toGet: [
      { id: 3002, name: "Sam Patel", direction: "to_get", amount: 65.83 },
      { id: 3001, name: "Jordan Lee", direction: "to_get", amount: 9.25 },
    ],
    toPay: [
      { id: 3003, name: "Taylor Kim", direction: "to_pay", amount: 36.0 },
      { id: 3001, name: "Jordan Lee", direction: "to_pay", amount: 28.8 },
    ],
  };
}

export function demoGroupsList(now = new Date()) {
  const groups: GroupListItem[] = DEMO_GROUPS.map((g) => {
    const rows = filterDemoExpenses({ groupId: g.id }, now);
    const myShare = rows.reduce((s, r) => s + Number(r.myShare ?? 0), 0);
    const myPaid = rows.reduce((s, r) => s + Number(r.myPaidShare ?? 0), 0);
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.date).getTime() -
        new Date(a.updatedAt ?? a.date).getTime(),
    );
    const last = sorted[0]?.updatedAt ?? sorted[0]?.date ?? null;
    return {
      id: g.id,
      name: g.name,
      groupType: null,
      expenseCount: rows.length,
      myShareTotal: String(myShare),
      myPaidTotal: String(myPaid),
      netBalance: String(myPaid - myShare),
      lastActivityAt: last,
    };
  });
  return { currency: "USD", groups };
}

export function demoGroupDetail(
  groupId: number,
  now = new Date(),
): GroupDetail | null {
  const group = DEMO_GROUPS.find((g) => g.id === groupId);
  if (!group) return null;

  const members = demoGroupMembers(groupId);
  if (!members) return null;

  const recent = demoListExpenses(
    { groupId, sort: "date", order: "desc", page: 1, pageSize: 25 },
    now,
  );
  const rows = filterDemoExpenses({ groupId }, now);
  const myShare = rows.reduce((s, r) => s + Number(r.myShare ?? 0), 0);

  return {
    id: group.id,
    name: group.name,
    groupType: null,
    currency: "USD",
    expenseCount: rows.length,
    myShareTotal: String(myShare),
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      expenseCount: 0,
      myShareTotal: "0",
    })),
    recentActivity: recent.items,
  };
}
