import "server-only";

import { and, desc, eq, isNull, max, sql, sum } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";

export type GroupListItem = {
  id: number;
  name: string;
  groupType: string | null;
  expenseCount: number;
  myShareTotal: string;
  myPaidTotal: string;
  /** Paid minus owed across synced expenses in this group (positive = owed to you). */
  netBalance: string;
  lastActivityAt: string | null;
};

export async function listSyncedGroups(): Promise<GroupListItem[]> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return [];

  const db = getDb();
  const rows = await db
    .select({
      id: schema.groups.splitwiseId,
      name: schema.groups.name,
      groupType: schema.groups.groupType,
      expenseCount: sql<number>`count(distinct ${schema.expenses.id})`.mapWith(
        Number,
      ),
      myShareTotal: sum(schema.expenseShares.owedShare),
      myPaidTotal: sum(schema.expenseShares.paidShare),
      lastActivityAt: max(schema.expenses.date),
    })
    .from(schema.groups)
    .leftJoin(
      schema.expenses,
      and(
        eq(schema.expenses.groupId, schema.groups.splitwiseId),
        eq(schema.expenses.accountUserId, owner.id),
        isNull(schema.expenses.deletedAt),
      ),
    )
    .leftJoin(
      schema.expenseShares,
      and(
        eq(schema.expenseShares.expenseId, schema.expenses.id),
        eq(schema.expenseShares.splitwiseUserId, owner.splitwiseId),
      ),
    )
    .where(eq(schema.groups.accountUserId, owner.id))
    .groupBy(
      schema.groups.splitwiseId,
      schema.groups.name,
      schema.groups.groupType,
    )
    .orderBy(desc(max(schema.expenses.date)));

  return rows.map((r) => {
    const myShareTotal = r.myShareTotal ?? "0";
    const myPaidTotal = r.myPaidTotal ?? "0";
    const netBalance = String(Number(myPaidTotal) - Number(myShareTotal));
    return {
      id: r.id,
      name: r.name,
      groupType: r.groupType,
      expenseCount: r.expenseCount,
      myShareTotal,
      myPaidTotal,
      netBalance,
      lastActivityAt: r.lastActivityAt?.toISOString() ?? null,
    };
  });
}
