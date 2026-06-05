import "server-only";

import { and, count, eq, isNull, sum } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { listExpenses } from "@/lib/expenses/queries";
import { fetchGroupMembers } from "@/lib/groups/members";
import type { ExpenseListItem } from "@/lib/expenses/types";

export type GroupMemberSpend = {
  id: number;
  name: string;
  expenseCount: number;
  myShareTotal: string;
};

export type GroupDetail = {
  id: number;
  name: string;
  groupType: string | null;
  currency: string;
  expenseCount: number;
  myShareTotal: string;
  members: GroupMemberSpend[];
  recentActivity: ExpenseListItem[];
};

export async function getGroupDetail(
  groupId: number,
): Promise<GroupDetail | null> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return null;

  const db = getDb();
  const groupRow = await db
    .select({
      id: schema.groups.splitwiseId,
      name: schema.groups.name,
      groupType: schema.groups.groupType,
    })
    .from(schema.groups)
    .where(
      and(
        eq(schema.groups.accountUserId, owner.id),
        eq(schema.groups.splitwiseId, groupId),
      ),
    )
    .limit(1);

  const group = groupRow[0];
  if (!group) return null;

  const stats = await db
    .select({
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
    .where(
      and(
        eq(schema.expenses.accountUserId, owner.id),
        eq(schema.expenses.groupId, groupId),
        isNull(schema.expenses.deletedAt),
      ),
    );

  const membersResult = await fetchGroupMembers(groupId);
  const members =
    "error" in membersResult
      ? []
      : membersResult.map((m) => ({
          id: m.id,
          name: m.name,
          expenseCount: 0,
          myShareTotal: "0",
        }));

  const recent = await listExpenses({
    groupId,
    sort: "date",
    order: "desc",
    page: 1,
    pageSize: 25,
  });

  return {
    id: group.id,
    name: group.name,
    groupType: group.groupType,
    currency: owner.defaultCurrency,
    expenseCount: stats[0]?.expenseCount ?? 0,
    myShareTotal: stats[0]?.myShareTotal ?? "0",
    members,
    recentActivity: recent.items,
  };
}
