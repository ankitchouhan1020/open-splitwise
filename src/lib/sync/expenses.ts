import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAccountOwner } from "@/lib/db/account";
import { requireAccessToken } from "@/lib/auth";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type {
  SplitwiseExpense,
  SplitwiseExpensesResponse,
} from "@/lib/splitwise/types";
import { releaseExpenseSync, tryAcquireExpenseSync } from "@/lib/sync/lock";

const PAGE_LIMIT = 50;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function upsertExpense(
  accountUserId: number,
  expense: SplitwiseExpense,
): Promise<void> {
  const db = getDb();
  const deletedAt = parseDate(expense.deleted_at);
  const expenseDate = parseDate(expense.date) ?? new Date();
  const updatedAt = parseDate(expense.updated_at) ?? new Date();

  const [row] = await db
    .insert(schema.expenses)
    .values({
      accountUserId,
      splitwiseId: expense.id,
      groupId: expense.group_id ?? 0,
      friendshipId: expense.friendship_id,
      cost: expense.cost,
      currencyCode: expense.currency_code,
      categoryId: expense.category_id,
      description: expense.description,
      details: expense.details,
      date: expenseDate,
      payment: expense.payment ?? false,
      deletedAt,
      raw: expense,
      updatedAt,
      syncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.expenses.accountUserId, schema.expenses.splitwiseId],
      set: {
        groupId: expense.group_id ?? 0,
        friendshipId: expense.friendship_id,
        cost: expense.cost,
        currencyCode: expense.currency_code,
        categoryId: expense.category_id,
        description: expense.description,
        details: expense.details,
        date: expenseDate,
        payment: expense.payment ?? false,
        deletedAt,
        raw: expense,
        updatedAt,
        syncedAt: new Date(),
      },
    })
    .returning({ id: schema.expenses.id });

  const expenseId = row.id;

  await db
    .delete(schema.expenseShares)
    .where(eq(schema.expenseShares.expenseId, expenseId));

  if (expense.users?.length) {
    await db.insert(schema.expenseShares).values(
      expense.users.map((u) => ({
        expenseId,
        splitwiseUserId: u.user_id,
        paidShare: u.paid_share,
        owedShare: u.owed_share,
        netBalance: u.net_balance ?? null,
      })),
    );
  }
}

async function setSyncStatus(
  accountUserId: number,
  patch: Partial<{
    expensesStatus: string;
    expensesError: string | null;
    expensesLastSyncAt: Date | null;
    expensesUpdatedAfter: Date | null;
    expenseCount: number;
  }>,
) {
  const db = getDb();
  await db
    .update(schema.syncState)
    .set(patch)
    .where(eq(schema.syncState.accountUserId, accountUserId));
}

export type ExpenseSyncResult = {
  synced: number;
  total: number;
};

export async function syncExpenses(): Promise<ExpenseSyncResult> {
  if (!tryAcquireExpenseSync()) {
    throw new Error("Expense sync already in progress");
  }

  const owner = await getAccountOwner();
  if (!owner) {
    releaseExpenseSync();
    throw new Error("No connected account in database. Reconnect Splitwise.");
  }

  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);
  const db = getDb();

  let [state] = await db
    .select()
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, owner.id))
    .limit(1);

  if (!state) {
    await db.insert(schema.syncState).values({ accountUserId: owner.id });
    [state] = await db
      .select()
      .from(schema.syncState)
      .where(eq(schema.syncState.accountUserId, owner.id))
      .limit(1);
  }

  await setSyncStatus(owner.id, {
    expensesStatus: "syncing",
    expensesError: null,
  });

  let synced = 0;
  let maxUpdatedAt: Date | null = state?.expensesUpdatedAfter ?? null;

  try {
    let offset = 0;
    while (true) {
      const params = new URLSearchParams({
        limit: String(PAGE_LIMIT),
        offset: String(offset),
      });
      if (state?.expensesUpdatedAfter) {
        params.set("updated_after", state.expensesUpdatedAfter.toISOString());
      }

      const { expenses } = await client.get<SplitwiseExpensesResponse>(
        `get_expenses?${params.toString()}`,
      );

      if (!expenses?.length) break;

      for (const expense of expenses) {
        await upsertExpense(owner.id, expense);
        synced += 1;
        const u = parseDate(expense.updated_at);
        if (u && (!maxUpdatedAt || u > maxUpdatedAt)) {
          maxUpdatedAt = u;
        }
      }

      offset += PAGE_LIMIT;
      if (expenses.length < PAGE_LIMIT) break;
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.expenses)
      .where(eq(schema.expenses.accountUserId, owner.id));

    await setSyncStatus(owner.id, {
      expensesStatus: "idle",
      expensesError: null,
      expensesLastSyncAt: new Date(),
      expensesUpdatedAfter: maxUpdatedAt ?? new Date(),
      expenseCount: total,
    });

    return { synced, total };
  } catch (err) {
    const message = err instanceof Error ? err.message : "sync_failed";
    await setSyncStatus(owner.id, {
      expensesStatus: "error",
      expensesError: message.slice(0, 500),
    });
    throw err;
  } finally {
    releaseExpenseSync();
  }
}

export async function getExpenseSyncStatus(accountUserId: number) {
  const db = getDb();
  const [state] = await db
    .select()
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, accountUserId))
    .limit(1);

  if (!state) {
    return {
      status: "idle" as const,
      lastSyncAt: null,
      expenseCount: 0,
      error: null,
    };
  }

  return {
    status: state.expensesStatus as "idle" | "syncing" | "error",
    lastSyncAt: state.expensesLastSyncAt,
    expenseCount: state.expenseCount,
    error: state.expensesError,
  };
}
