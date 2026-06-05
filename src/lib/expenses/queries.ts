import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  isNull,
  lte,
  or,
  sql,
  sum,
  type SQL,
} from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import type { ExpenseFilters, ExpenseListSort } from "@/lib/expenses/filters";
import type { ExpenseDetail, ExpenseListItem } from "@/lib/expenses/types";
import { categoryIconFromRaw } from "@/lib/splitwise/category-icon";

export type { ExpenseDetail, ExpenseListItem } from "@/lib/expenses/types";
export type { ExpenseListSort, ExpenseListOrder } from "@/lib/expenses/filters";

function sortColumn(sort: ExpenseListSort) {
  switch (sort) {
    case "cost":
      return sql`coalesce(${schema.expenseShares.owedShare}::numeric, 0)`;
    case "description":
      return schema.expenses.description;
    default:
      return schema.expenses.date;
  }
}

type RawExpenseUser = {
  user_id: number;
  paid_share: string;
  owed_share?: string;
  user?: { id?: number; first_name?: string; last_name?: string };
};

function rawExpenseUsers(raw: unknown): RawExpenseUser[] {
  if (!raw || typeof raw !== "object") return [];
  const users = (raw as { users?: RawExpenseUser[] }).users;
  return Array.isArray(users) ? users : [];
}

function paidByFromRaw(raw: unknown): string {
  const users = rawExpenseUsers(raw);
  if (users.length > 0) {
    let bestPaid = 0;
    let payerName: string | null = null;
    for (const u of users) {
      const paid = Number(u.paid_share);
      if (paid > bestPaid + 0.005) {
        bestPaid = paid;
        payerName = formatParticipantName(
          u.user?.first_name,
          u.user?.last_name,
          u.user_id ?? u.user?.id,
        );
      }
    }
    if (payerName) return payerName;
  }

  const createdBy = (
    raw as { created_by?: { first_name?: string; last_name?: string } }
  ).created_by;
  if (!createdBy) return "—";
  return (
    [createdBy.first_name, createdBy.last_name].filter(Boolean).join(" ") || "—"
  );
}

function paidToFromRaw(raw: unknown): string {
  const users = rawExpenseUsers(raw);
  if (users.length === 0) return "—";

  let bestOwed = 0;
  let payeeName: string | null = null;
  for (const u of users) {
    const owed = Number(u.owed_share ?? 0);
    if (owed > bestOwed + 0.005) {
      bestOwed = owed;
      payeeName = formatParticipantName(
        u.user?.first_name,
        u.user?.last_name,
        u.user_id ?? u.user?.id,
      );
    }
  }
  return payeeName ?? "—";
}

function formatParticipantName(
  first?: string | null,
  last?: string | null,
  fallbackId?: number,
): string {
  const name = [first, last].filter(Boolean).join(" ");
  if (name) return name;
  if (fallbackId != null) return `User ${fallbackId}`;
  return "—";
}

function participantNamesFromRaw(raw: unknown): Map<number, string> {
  const map = new Map<number, string>();
  if (!raw || typeof raw !== "object") return map;
  const users = (
    raw as {
      users?: Array<{
        user_id: number;
        user?: { id?: number; first_name?: string; last_name?: string };
      }>;
    }
  ).users;
  if (!Array.isArray(users)) return map;
  for (const entry of users) {
    const id = entry.user_id ?? entry.user?.id;
    if (id == null) continue;
    map.set(
      id,
      formatParticipantName(entry.user?.first_name, entry.user?.last_name, id),
    );
  }
  return map;
}

function expenseComments(raw: unknown, searchText: string): string | null {
  if (raw && typeof raw === "object") {
    const comments = (raw as { comments?: Array<{ content?: string }> })
      .comments;
    if (Array.isArray(comments) && comments.length > 0) {
      const body = comments
        .map((c) => c.content?.trim())
        .filter((c): c is string => Boolean(c))
        .join("\n\n");
      if (body) return body;
    }
  }
  const text = searchText.trim();
  return text || null;
}

async function buildParticipantNameMap(
  accountUserId: number,
  raw: unknown,
): Promise<Map<number, string>> {
  const db = getDb();
  const [friendRows, ownerRow] = await Promise.all([
    db
      .select({
        id: schema.friends.splitwiseId,
        firstName: schema.friends.firstName,
        lastName: schema.friends.lastName,
      })
      .from(schema.friends)
      .where(eq(schema.friends.accountUserId, accountUserId)),
    db
      .select({
        id: schema.users.splitwiseId,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
      })
      .from(schema.users)
      .where(eq(schema.users.id, accountUserId))
      .limit(1),
  ]);

  const map = participantNamesFromRaw(raw);
  for (const f of friendRows) {
    if (!map.has(f.id)) {
      map.set(f.id, formatParticipantName(f.firstName, f.lastName, f.id));
    }
  }
  const owner = ownerRow[0];
  if (owner && !map.has(owner.id)) {
    map.set(
      owner.id,
      formatParticipantName(owner.firstName, owner.lastName, owner.id),
    );
  }
  return map;
}

function ftsCondition(query: string): SQL {
  return sql`to_tsvector('english', coalesce(${schema.expenses.description}, '') || ' ' || coalesce(${schema.expenses.details}, '') || ' ' || coalesce(${schema.expenses.searchText}, '')) @@ plainto_tsquery('english', ${query})`;
}

export function buildExpenseWhere(
  accountUserId: number,
  ownerSplitwiseId: number,
  filters: ExpenseFilters,
): SQL {
  const parts: SQL[] = [
    eq(schema.expenses.accountUserId, accountUserId),
    isNull(schema.expenses.deletedAt),
  ];

  if (filters.q?.trim()) {
    parts.push(ftsCondition(filters.q.trim()));
  }
  if (filters.dateFrom) {
    parts.push(gte(schema.expenses.date, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    const end = new Date(filters.dateTo);
    end.setHours(23, 59, 59, 999);
    parts.push(lte(schema.expenses.date, end));
  }
  if (filters.groupId !== undefined) {
    if (filters.groupId === 0) {
      parts.push(
        or(eq(schema.expenses.groupId, 0), isNull(schema.expenses.groupId))!,
      );
    } else {
      parts.push(eq(schema.expenses.groupId, filters.groupId));
    }
  }
  if (filters.categoryId !== undefined) {
    parts.push(eq(schema.expenses.categoryId, filters.categoryId));
  }
  if (filters.currency) {
    parts.push(eq(schema.expenses.currencyCode, filters.currency));
  }
  if (filters.payment === true) {
    parts.push(eq(schema.expenses.payment, true));
  }
  if (filters.payment === false) {
    parts.push(eq(schema.expenses.payment, false));
  }
  if (filters.costMin !== undefined) {
    parts.push(gte(schema.expenses.cost, String(filters.costMin)));
  }
  if (filters.costMax !== undefined) {
    parts.push(lte(schema.expenses.cost, String(filters.costMax)));
  }
  if (filters.friendId !== undefined) {
    const friendShare = getDb()
      .select({ one: sql`1` })
      .from(schema.expenseShares)
      .where(
        and(
          eq(schema.expenseShares.expenseId, schema.expenses.id),
          eq(schema.expenseShares.splitwiseUserId, filters.friendId),
        ),
      );
    parts.push(
      or(
        eq(schema.expenses.friendshipId, filters.friendId),
        exists(friendShare),
      )!,
    );
  }
  if (filters.shareMin !== undefined || filters.shareMax !== undefined) {
    const shareParts: SQL[] = [
      eq(schema.expenseShares.expenseId, schema.expenses.id),
      eq(schema.expenseShares.splitwiseUserId, ownerSplitwiseId),
    ];
    if (filters.shareMin !== undefined) {
      shareParts.push(
        gte(schema.expenseShares.owedShare, String(filters.shareMin)),
      );
    }
    if (filters.shareMax !== undefined) {
      shareParts.push(
        lte(schema.expenseShares.owedShare, String(filters.shareMax)),
      );
    }
    const shareSub = getDb()
      .select({ one: sql`1` })
      .from(schema.expenseShares)
      .where(and(...shareParts));
    parts.push(exists(shareSub));
  }

  return and(...parts)!;
}

function mapListRow(r: {
  id: number;
  splitwiseId: number;
  date: Date;
  description: string;
  details: string | null;
  cost: string;
  currencyCode: string;
  payment: boolean;
  groupId: number | null;
  categoryId: number | null;
  raw: unknown;
  groupName: string | null;
  categoryName: string | null;
  categoryRaw: unknown;
  myShare: string | null;
  myPaidShare: string | null;
}): ExpenseListItem {
  const iconStyle = categoryIconFromRaw(r.categoryRaw);
  return {
    id: r.id,
    splitwiseId: r.splitwiseId,
    date: r.date.toISOString(),
    description: r.description,
    details: r.details,
    groupId: r.groupId,
    groupName:
      r.groupId === 0 || r.groupId == null
        ? "No group"
        : (r.groupName ?? `Group #${r.groupId}`),
    categoryId: r.categoryId,
    categoryName:
      r.categoryName ?? (r.categoryId ? `Category #${r.categoryId}` : null),
    categoryIconUrl: iconStyle?.iconUrl ?? null,
    categoryIconBg: iconStyle?.backgroundColor ?? null,
    cost: r.cost,
    currencyCode: r.currencyCode,
    myShare: r.myShare,
    myPaidShare: r.myPaidShare,
    paidBy: paidByFromRaw(r.raw),
    paidTo: paidToFromRaw(r.raw),
    payment: r.payment,
  };
}

const listSelect = {
  id: schema.expenses.id,
  splitwiseId: schema.expenses.splitwiseId,
  date: schema.expenses.date,
  description: schema.expenses.description,
  details: schema.expenses.details,
  cost: schema.expenses.cost,
  currencyCode: schema.expenses.currencyCode,
  payment: schema.expenses.payment,
  groupId: schema.expenses.groupId,
  categoryId: schema.expenses.categoryId,
  raw: schema.expenses.raw,
  groupName: schema.groups.name,
  categoryName: schema.categories.name,
  categoryRaw: schema.categories.raw,
  myShare: schema.expenseShares.owedShare,
  myPaidShare: schema.expenseShares.paidShare,
};

function listJoins(owner: { id: number; splitwiseId: number }) {
  return {
    groups: and(
      eq(schema.groups.splitwiseId, schema.expenses.groupId),
      eq(schema.groups.accountUserId, owner.id),
    ),
    categories: eq(schema.categories.splitwiseId, schema.expenses.categoryId),
    shares: and(
      eq(schema.expenseShares.expenseId, schema.expenses.id),
      eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
    ),
  };
}

export type ExpenseSummary = {
  count: number;
  byCurrency: Array<{ currency: string; myShareTotal: string }>;
};

export async function getExpenseSummary(
  filters: ExpenseFilters = {},
): Promise<ExpenseSummary> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return { count: 0, byCurrency: [] };
  }

  const db = getDb();
  const where = buildExpenseWhere(owner.id, owner.splitwiseId, filters);
  const shareJoin = and(
    eq(schema.expenseShares.expenseId, schema.expenses.id),
    eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
  );

  const [{ count: expenseCount }] = await db
    .select({ count: count() })
    .from(schema.expenses)
    .where(where);

  const currencyRows = await db
    .select({
      currency: schema.expenses.currencyCode,
      myShareTotal: sum(schema.expenseShares.owedShare),
    })
    .from(schema.expenses)
    .leftJoin(schema.expenseShares, shareJoin)
    .where(where)
    .groupBy(schema.expenses.currencyCode)
    .orderBy(asc(schema.expenses.currencyCode));

  return {
    count: expenseCount ?? 0,
    byCurrency: currencyRows.map((r) => ({
      currency: r.currency,
      myShareTotal: r.myShareTotal ?? "0",
    })),
  };
}

export async function listExpenses(filters: ExpenseFilters = {}): Promise<{
  items: ExpenseListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return { items: [], total: 0, page: 1, pageSize: filters.pageSize ?? 100 };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 100));
  const offset = (page - 1) * pageSize;
  const sort = filters.sort ?? "date";
  const order = filters.order ?? "desc";
  const orderFn = order === "asc" ? asc : desc;

  const db = getDb();
  const where = buildExpenseWhere(owner.id, owner.splitwiseId, filters);
  const joins = listJoins(owner);

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.expenses)
    .where(where);

  const rows = await db
    .select(listSelect)
    .from(schema.expenses)
    .leftJoin(schema.groups, joins.groups)
    .leftJoin(schema.categories, joins.categories)
    .leftJoin(schema.expenseShares, joins.shares)
    .where(where)
    .orderBy(orderFn(sortColumn(sort)))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map(mapListRow),
    total,
    page,
    pageSize,
  };
}

export async function listAllExpensesForExport(
  filters: ExpenseFilters = {},
  limit = 20_000,
): Promise<ExpenseListItem[]> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return [];

  const db = getDb();
  const where = buildExpenseWhere(owner.id, owner.splitwiseId, filters);
  const joins = listJoins(owner);
  const sort = filters.sort ?? "date";
  const order = filters.order ?? "desc";
  const orderFn = order === "asc" ? asc : desc;

  const rows = await db
    .select(listSelect)
    .from(schema.expenses)
    .leftJoin(schema.groups, joins.groups)
    .leftJoin(schema.categories, joins.categories)
    .leftJoin(schema.expenseShares, joins.shares)
    .where(where)
    .orderBy(orderFn(sortColumn(sort)))
    .limit(limit);

  return rows.map(mapListRow);
}

export async function getExpenseDetail(
  expenseId: number,
): Promise<ExpenseDetail | null> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return null;

  const db = getDb();
  const joins = listJoins(owner);
  const [row] = await db
    .select({
      ...listSelect,
      friendshipId: schema.expenses.friendshipId,
      searchText: schema.expenses.searchText,
    })
    .from(schema.expenses)
    .leftJoin(schema.groups, joins.groups)
    .leftJoin(schema.categories, joins.categories)
    .leftJoin(schema.expenseShares, joins.shares)
    .where(
      and(
        eq(schema.expenses.id, expenseId),
        eq(schema.expenses.accountUserId, owner.id),
      ),
    )
    .limit(1);

  if (!row) return null;

  const shares = await db
    .select({
      splitwiseUserId: schema.expenseShares.splitwiseUserId,
      paidShare: schema.expenseShares.paidShare,
      owedShare: schema.expenseShares.owedShare,
      netBalance: schema.expenseShares.netBalance,
    })
    .from(schema.expenseShares)
    .where(eq(schema.expenseShares.expenseId, expenseId));

  const nameMap = await buildParticipantNameMap(owner.id, row.raw);
  const base = mapListRow(row);
  return {
    ...base,
    groupId: row.groupId,
    categoryId: row.categoryId,
    friendshipId: row.friendshipId,
    comments: expenseComments(row.raw, row.searchText),
    shares: shares.map((s) => ({
      ...s,
      name:
        nameMap.get(s.splitwiseUserId) ??
        formatParticipantName(undefined, undefined, s.splitwiseUserId),
    })),
  };
}

export async function getFilterOptions(): Promise<{
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
}> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return { groups: [], friends: [], categories: [], currencies: [] };
  }

  const db = getDb();
  const [groupRows, friendRows, categoryRows, currencyRows] = await Promise.all(
    [
      db
        .select({
          id: schema.groups.splitwiseId,
          name: schema.groups.name,
        })
        .from(schema.groups)
        .where(eq(schema.groups.accountUserId, owner.id))
        .orderBy(
          sql`${schema.groups.updatedAt} desc nulls last`,
          asc(schema.groups.name),
        ),
      db
        .select({
          id: schema.friends.splitwiseId,
          firstName: schema.friends.firstName,
          lastName: schema.friends.lastName,
        })
        .from(schema.friends)
        .where(eq(schema.friends.accountUserId, owner.id))
        .orderBy(asc(schema.friends.firstName)),
      db
        .select({
          id: schema.categories.splitwiseId,
          name: schema.categories.name,
        })
        .from(schema.categories)
        .orderBy(asc(schema.categories.name)),
      db
        .selectDistinct({ currency: schema.expenses.currencyCode })
        .from(schema.expenses)
        .where(eq(schema.expenses.accountUserId, owner.id))
        .orderBy(asc(schema.expenses.currencyCode)),
    ],
  );

  return {
    groups: [
      { id: 0, name: "No group" },
      ...groupRows.filter((g) => g.id !== 0),
    ],
    friends: friendRows.map((f) => ({
      id: f.id,
      name:
        [f.firstName, f.lastName].filter(Boolean).join(" ") || `User ${f.id}`,
    })),
    categories: categoryRows,
    currencies: currencyRows.map((r) => r.currency),
  };
}
