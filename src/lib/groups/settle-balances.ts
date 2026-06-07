import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import {
  expenseShareDirection,
  type ShareDirectionInput,
} from "@/lib/expenses/share-direction";
import {
  mergeOwnerSettleEntries,
  ownerSettleEntriesFromDebts,
  type CachedGroupDebt,
} from "@/lib/groups/debt-model";
import { resolveGroupParticipantNames } from "@/lib/users/resolve-names";

const EPS = 0.005;

export type GroupSettleEntry = {
  userId: number;
  name: string;
  direction: "to_get" | "to_pay";
  amount: number;
  expenseCount: number;
  lastActivityAt: string | null;
};

export type GroupSettlePage = {
  groupId: number;
  groupName: string;
  currency: string;
  toGet: GroupSettleEntry[];
  toPay: GroupSettleEntry[];
};

type ExpenseForSettle = {
  activityAt: string;
  shares: ShareDirectionInput[];
};

type MemberStats = {
  expenseCount: number;
  lastActivityAt: string | null;
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Fallback pairwise balances from synced expense shares (unsimplified). */
export function computeGroupSettleBalances(
  ownerSplitwiseId: number,
  expenses: ExpenseForSettle[],
  memberNames: Map<number, string>,
): { toGet: GroupSettleEntry[]; toPay: GroupSettleEntry[] } {
  const balances = new Map<number, number>();
  const stats = new Map<number, MemberStats>();

  for (const expense of expenses) {
    const involved = new Set<number>();
    for (const share of expense.shares) {
      if (share.splitwiseUserId === ownerSplitwiseId) continue;
      involved.add(share.splitwiseUserId);
    }
    for (const memberId of involved) {
      const prev = stats.get(memberId) ?? {
        expenseCount: 0,
        lastActivityAt: null,
      };
      stats.set(memberId, {
        expenseCount: prev.expenseCount + 1,
        lastActivityAt:
          !prev.lastActivityAt ||
          expense.activityAt.localeCompare(prev.lastActivityAt) > 0
            ? expense.activityAt
            : prev.lastActivityAt,
      });
    }

    const { paidByUserId } = expenseShareDirection(expense.shares);
    if (paidByUserId == null) continue;

    for (const share of expense.shares) {
      const owed = Number.parseFloat(share.owedShare);
      if (!Number.isFinite(owed) || owed <= EPS) continue;
      const userId = share.splitwiseUserId;
      if (userId === paidByUserId) continue;

      if (paidByUserId === ownerSplitwiseId && userId !== ownerSplitwiseId) {
        balances.set(userId, (balances.get(userId) ?? 0) + owed);
      } else if (
        userId === ownerSplitwiseId &&
        paidByUserId !== ownerSplitwiseId
      ) {
        balances.set(paidByUserId, (balances.get(paidByUserId) ?? 0) - owed);
      }
    }
  }

  const toGet: GroupSettleEntry[] = [];
  const toPay: GroupSettleEntry[] = [];

  for (const [userId, raw] of balances) {
    const amount = roundMoney(Math.abs(raw));
    if (amount <= EPS) continue;
    const name = memberNames.get(userId) ?? `User ${userId}`;
    const memberStats = stats.get(userId) ?? {
      expenseCount: 0,
      lastActivityAt: null,
    };
    const entry: GroupSettleEntry = {
      userId,
      name,
      direction: raw > 0 ? "to_get" : "to_pay",
      amount,
      expenseCount: memberStats.expenseCount,
      lastActivityAt: memberStats.lastActivityAt,
    };
    if (raw > 0) toGet.push(entry);
    else toPay.push(entry);
  }

  toGet.sort((a, b) => b.amount - a.amount);
  toPay.sort((a, b) => b.amount - a.amount);

  return { toGet, toPay };
}

function buildSettleEntriesFromDebts(
  ownerSplitwiseId: number,
  debts: CachedGroupDebt[],
  currency: string,
  memberNames: Map<number, string>,
  stats: Map<number, MemberStats>,
): { toGet: GroupSettleEntry[]; toPay: GroupSettleEntry[] } {
  const settleEntries = mergeOwnerSettleEntries(
    ownerSettleEntriesFromDebts(ownerSplitwiseId, debts, currency),
  );

  const toGet: GroupSettleEntry[] = [];
  const toPay: GroupSettleEntry[] = [];

  for (const entry of settleEntries) {
    const memberStats = stats.get(entry.userId) ?? {
      expenseCount: 0,
      lastActivityAt: null,
    };
    const row: GroupSettleEntry = {
      userId: entry.userId,
      name: memberNames.get(entry.userId) ?? `User ${entry.userId}`,
      direction: entry.direction,
      amount: entry.amount,
      expenseCount: memberStats.expenseCount,
      lastActivityAt: memberStats.lastActivityAt,
    };
    if (entry.direction === "to_get") toGet.push(row);
    else toPay.push(row);
  }

  toGet.sort((a, b) => b.amount - a.amount);
  toPay.sort((a, b) => b.amount - a.amount);
  return { toGet, toPay };
}

async function loadMemberNames(
  accountUserId: number,
  groupSplitwiseId: number,
  debtUserIds: number[] = [],
): Promise<Map<number, string>> {
  const participantNames = await resolveGroupParticipantNames(
    accountUserId,
    groupSplitwiseId,
  );
  for (const userId of debtUserIds) {
    if (!participantNames.has(userId)) {
      participantNames.set(userId, `User ${userId}`);
    }
  }
  return participantNames;
}

async function loadCachedDebts(
  accountUserId: number,
  groupSplitwiseId: number,
): Promise<CachedGroupDebt[]> {
  const db = getDb();
  const rows = await db
    .select({
      fromUserId: schema.groupDebts.fromUserId,
      toUserId: schema.groupDebts.toUserId,
      amount: schema.groupDebts.amount,
      currencyCode: schema.groupDebts.currencyCode,
    })
    .from(schema.groupDebts)
    .where(
      and(
        eq(schema.groupDebts.accountUserId, accountUserId),
        eq(schema.groupDebts.groupSplitwiseId, groupSplitwiseId),
      ),
    );

  return rows.map((row) => ({
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    amount: Number(row.amount),
    currencyCode: row.currencyCode,
  }));
}

async function loadExpenseStats(
  accountUserId: number,
  ownerSplitwiseId: number,
  groupSplitwiseId: number,
): Promise<Map<number, MemberStats>> {
  const db = getDb();
  const expenseRows = await db
    .select({
      date: schema.expenses.date,
      updatedAt: schema.expenses.updatedAt,
      splitwiseUserId: schema.expenseShares.splitwiseUserId,
      paidShare: schema.expenseShares.paidShare,
      owedShare: schema.expenseShares.owedShare,
      expenseId: schema.expenses.id,
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      eq(schema.expenseShares.expenseId, schema.expenses.id),
    )
    .where(
      and(
        eq(schema.expenses.accountUserId, accountUserId),
        eq(schema.expenses.groupId, groupSplitwiseId),
        isNull(schema.expenses.deletedAt),
      ),
    );

  const byExpense = new Map<
    number,
    { activityAt: string; shares: ShareDirectionInput[] }
  >();

  for (const row of expenseRows) {
    const activityAt = (row.updatedAt ?? row.date).toISOString();
    let bucket = byExpense.get(row.expenseId);
    if (!bucket) {
      bucket = { activityAt, shares: [] };
      byExpense.set(row.expenseId, bucket);
    }
    bucket.shares.push({
      splitwiseUserId: row.splitwiseUserId,
      paidShare: row.paidShare,
      owedShare: row.owedShare,
    });
    if (activityAt.localeCompare(bucket.activityAt) > 0) {
      bucket.activityAt = activityAt;
    }
  }

  const stats = new Map<number, MemberStats>();
  for (const expense of byExpense.values()) {
    const involved = new Set<number>();
    for (const share of expense.shares) {
      if (share.splitwiseUserId === ownerSplitwiseId) continue;
      involved.add(share.splitwiseUserId);
    }
    for (const memberId of involved) {
      const prev = stats.get(memberId) ?? {
        expenseCount: 0,
        lastActivityAt: null,
      };
      stats.set(memberId, {
        expenseCount: prev.expenseCount + 1,
        lastActivityAt:
          !prev.lastActivityAt ||
          expense.activityAt.localeCompare(prev.lastActivityAt) > 0
            ? expense.activityAt
            : prev.lastActivityAt,
      });
    }
  }

  return stats;
}

export async function getGroupSettlePage(
  groupId: number,
): Promise<GroupSettlePage | null> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return null;

  const db = getDb();
  const [groupRow] = await db
    .select({
      id: schema.groups.splitwiseId,
      name: schema.groups.name,
      balancesSyncedAt: schema.groups.balancesSyncedAt,
    })
    .from(schema.groups)
    .where(
      and(
        eq(schema.groups.accountUserId, owner.id),
        eq(schema.groups.splitwiseId, groupId),
      ),
    )
    .limit(1);

  if (!groupRow) return null;

  const debtsForNames = groupRow.balancesSyncedAt
    ? await loadCachedDebts(owner.id, groupId)
    : [];
  const debtUserIds = debtsForNames.flatMap((debt) => [
    debt.fromUserId,
    debt.toUserId,
  ]);
  const memberNames = await loadMemberNames(owner.id, groupId, debtUserIds);
  const stats = await loadExpenseStats(owner.id, owner.splitwiseId, groupId);

  if (groupRow.balancesSyncedAt) {
    const debts = await loadCachedDebts(owner.id, groupId);
    const { toGet, toPay } = buildSettleEntriesFromDebts(
      owner.splitwiseId,
      debts,
      owner.defaultCurrency,
      memberNames,
      stats,
    );

    return {
      groupId: groupRow.id,
      groupName: groupRow.name,
      currency: owner.defaultCurrency,
      toGet,
      toPay,
    };
  }

  const expenseRows = await db
    .select({
      date: schema.expenses.date,
      updatedAt: schema.expenses.updatedAt,
      splitwiseUserId: schema.expenseShares.splitwiseUserId,
      paidShare: schema.expenseShares.paidShare,
      owedShare: schema.expenseShares.owedShare,
      expenseId: schema.expenses.id,
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseShares,
      eq(schema.expenseShares.expenseId, schema.expenses.id),
    )
    .where(
      and(
        eq(schema.expenses.accountUserId, owner.id),
        eq(schema.expenses.groupId, groupId),
        isNull(schema.expenses.deletedAt),
      ),
    );

  const byExpense = new Map<
    number,
    { activityAt: string; shares: ShareDirectionInput[] }
  >();

  for (const row of expenseRows) {
    const activityAt = (row.updatedAt ?? row.date).toISOString();
    let bucket = byExpense.get(row.expenseId);
    if (!bucket) {
      bucket = { activityAt, shares: [] };
      byExpense.set(row.expenseId, bucket);
    }
    bucket.shares.push({
      splitwiseUserId: row.splitwiseUserId,
      paidShare: row.paidShare,
      owedShare: row.owedShare,
    });
    if (activityAt.localeCompare(bucket.activityAt) > 0) {
      bucket.activityAt = activityAt;
    }
  }

  const { toGet, toPay } = computeGroupSettleBalances(
    owner.splitwiseId,
    [...byExpense.values()],
    memberNames,
  );

  return {
    groupId: groupRow.id,
    groupName: groupRow.name,
    currency: owner.defaultCurrency,
    toGet,
    toPay,
  };
}
