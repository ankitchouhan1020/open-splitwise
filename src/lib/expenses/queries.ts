import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAccountOwner } from "@/lib/db/account";

export type ExpenseListSort = "date" | "cost" | "description";
export type ExpenseListOrder = "asc" | "desc";

export type ExpenseListItem = {
  id: number;
  splitwiseId: number;
  date: string;
  description: string;
  details: string | null;
  groupName: string;
  categoryName: string | null;
  cost: string;
  currencyCode: string;
  myShare: string | null;
  paidBy: string;
  payment: boolean;
};

export type ExpenseDetail = ExpenseListItem & {
  groupId: number | null;
  categoryId: number | null;
  friendshipId: number | null;
  shares: Array<{
    splitwiseUserId: number;
    paidShare: string;
    owedShare: string;
    netBalance: string | null;
  }>;
  raw: unknown;
};

function sortColumn(sort: ExpenseListSort) {
  switch (sort) {
    case "cost":
      return schema.expenses.cost;
    case "description":
      return schema.expenses.description;
    default:
      return schema.expenses.date;
  }
}

function paidByFromRaw(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "—";
  const createdBy = (
    raw as { created_by?: { first_name?: string; last_name?: string } }
  ).created_by;
  if (!createdBy) return "—";
  return (
    [createdBy.first_name, createdBy.last_name].filter(Boolean).join(" ") || "—"
  );
}

export async function listExpenses(options: {
  page?: number;
  pageSize?: number;
  sort?: ExpenseListSort;
  order?: ExpenseListOrder;
}): Promise<{
  items: ExpenseListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const owner = await getAccountOwner();
  if (!owner) {
    return { items: [], total: 0, page: 1, pageSize: options.pageSize ?? 100 };
  }

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, options.pageSize ?? 100));
  const offset = (page - 1) * pageSize;
  const sort = options.sort ?? "date";
  const order = options.order ?? "desc";
  const orderFn = order === "asc" ? asc : desc;

  const db = getDb();
  const where = and(
    eq(schema.expenses.accountUserId, owner.id),
    isNull(schema.expenses.deletedAt),
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.expenses)
    .where(where);

  const rows = await db
    .select({
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
      myShare: schema.expenseShares.owedShare,
    })
    .from(schema.expenses)
    .leftJoin(
      schema.groups,
      and(
        eq(schema.groups.splitwiseId, schema.expenses.groupId),
        eq(schema.groups.accountUserId, owner.id),
      ),
    )
    .leftJoin(
      schema.categories,
      eq(schema.categories.splitwiseId, schema.expenses.categoryId),
    )
    .leftJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
      ),
    )
    .where(where)
    .orderBy(orderFn(sortColumn(sort)))
    .limit(pageSize)
    .offset(offset);

  const items: ExpenseListItem[] = rows.map((r) => ({
    id: r.id,
    splitwiseId: r.splitwiseId,
    date: r.date.toISOString(),
    description: r.description,
    details: r.details,
    groupName:
      r.groupId === 0 || r.groupId == null
        ? "No group"
        : (r.groupName ?? `Group #${r.groupId}`),
    categoryName:
      r.categoryName ?? (r.categoryId ? `Category #${r.categoryId}` : null),
    cost: r.cost,
    currencyCode: r.currencyCode,
    myShare: r.myShare,
    paidBy: paidByFromRaw(r.raw),
    payment: r.payment,
  }));

  return { items, total, page, pageSize };
}

export async function getExpenseDetail(
  expenseId: number,
): Promise<ExpenseDetail | null> {
  const owner = await getAccountOwner();
  if (!owner) return null;

  const db = getDb();
  const [row] = await db
    .select({
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
      friendshipId: schema.expenses.friendshipId,
      raw: schema.expenses.raw,
      groupName: schema.groups.name,
      categoryName: schema.categories.name,
      myShare: schema.expenseShares.owedShare,
    })
    .from(schema.expenses)
    .leftJoin(
      schema.groups,
      and(
        eq(schema.groups.splitwiseId, schema.expenses.groupId),
        eq(schema.groups.accountUserId, owner.id),
      ),
    )
    .leftJoin(
      schema.categories,
      eq(schema.categories.splitwiseId, schema.expenses.categoryId),
    )
    .leftJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
      ),
    )
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

  return {
    id: row.id,
    splitwiseId: row.splitwiseId,
    date: row.date.toISOString(),
    description: row.description,
    details: row.details,
    groupName:
      row.groupId === 0 || row.groupId == null
        ? "No group"
        : (row.groupName ?? `Group #${row.groupId}`),
    categoryName:
      row.categoryName ??
      (row.categoryId ? `Category #${row.categoryId}` : null),
    cost: row.cost,
    currencyCode: row.currencyCode,
    myShare: row.myShare,
    paidBy: paidByFromRaw(row.raw),
    payment: row.payment,
    groupId: row.groupId,
    categoryId: row.categoryId,
    friendshipId: row.friendshipId,
    shares,
    raw: row.raw,
  };
}
