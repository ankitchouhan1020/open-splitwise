import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import { buildExpenseSearchText } from "@/lib/expenses/search";
import type { SyncRunContext } from "@/lib/sync/context";
import type {
  SplitwiseCommentsResponse,
  SplitwiseExpense,
  SplitwiseExpensesResponse,
} from "@/lib/splitwise/types";
import type { SplitwiseClient } from "@/lib/splitwise/client";
import { releaseExpenseSync, tryAcquireExpenseSync } from "@/lib/sync/lock";
import {
  clearSyncProgress,
  readSyncProgress,
  setSyncProgress,
  type SyncProgress,
} from "@/lib/sync/progress";
import { reconcileStaleSyncState } from "@/lib/sync/reconcile";

const PAGE_LIMIT = 50;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Map Splitwise API expense to DB row; never pass undefined (Drizzle emits invalid DEFAULT). */
function normalizeExpenseRow(
  expense: SplitwiseExpense,
  options?: { searchText?: string },
) {
  const description = expense.description?.trim();
  const details = expense.details?.trim();

  return {
    groupId: expense.group_id ?? 0,
    friendshipId: expense.friendship_id ?? null,
    cost: expense.cost,
    currencyCode: expense.currency_code,
    categoryId: expense.category_id ?? expense.category?.id ?? null,
    description:
      description && description.length > 0 ? description : "(no description)",
    details: details && details.length > 0 ? details : null,
    payment: expense.payment ?? false,
    searchText: options?.searchText ?? "",
  };
}

async function fetchCommentSearchText(
  client: SplitwiseClient,
  expenseId: number,
): Promise<string> {
  try {
    const { comments } = await client.get<SplitwiseCommentsResponse>(
      `get_comments?expense_id=${expenseId}`,
    );
    return buildExpenseSearchText(
      (comments ?? []).map((c) => c.content).filter(Boolean),
    );
  } catch {
    return "";
  }
}

export async function upsertExpense(
  accountUserId: number,
  expense: SplitwiseExpense,
  options?: { searchText?: string },
): Promise<void> {
  const db = getDb();
  const deletedAt = parseDate(expense.deleted_at);
  const expenseDate = parseDate(expense.date) ?? new Date();
  const updatedAt = parseDate(expense.updated_at) ?? new Date();
  const row = normalizeExpenseRow(expense, options);
  const syncedAt = new Date();

  const [inserted] = await db
    .insert(schema.expenses)
    .values({
      accountUserId,
      splitwiseId: expense.id,
      ...row,
      date: expenseDate,
      deletedAt,
      raw: expense,
      updatedAt,
      syncedAt,
    })
    .onConflictDoUpdate({
      target: [schema.expenses.accountUserId, schema.expenses.splitwiseId],
      set: {
        ...row,
        date: expenseDate,
        deletedAt,
        raw: expense,
        updatedAt,
        syncedAt,
      },
    })
    .returning({ id: schema.expenses.id });

  const expenseId = inserted.id;

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
    syncPhase: string | null;
    syncProgressSynced: number;
    syncProgressLabel: string | null;
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

export async function syncExpenses(ctx: SyncRunContext): Promise<ExpenseSyncResult> {
  const { accountUserId, accessToken } = ctx;

  await reconcileStaleSyncState(accountUserId);

  if (!tryAcquireExpenseSync(accountUserId)) {
    throw new Error("Expense sync already in progress");
  }

  const client = createSplitwiseClient(accessToken);
  const db = getDb();

  let [state] = await db
    .select()
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, accountUserId))
    .limit(1);

  if (!state) {
    await db.insert(schema.syncState).values({ accountUserId });
    [state] = await db
      .select()
      .from(schema.syncState)
      .where(eq(schema.syncState.accountUserId, accountUserId))
      .limit(1);
  }

  await setSyncStatus(accountUserId, {
    expensesStatus: "syncing",
    expensesError: null,
    syncPhase: "expenses",
    syncProgressSynced: 0,
    syncProgressLabel: null,
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
        let searchText = "";
        if ((expense.comments_count ?? 0) > 0) {
          searchText = await fetchCommentSearchText(client, expense.id);
        }
        await upsertExpense(accountUserId, expense, { searchText });
        synced += 1;
        const u = parseDate(expense.updated_at);
        if (u && (!maxUpdatedAt || u > maxUpdatedAt)) {
          maxUpdatedAt = u;
        }
      }

      offset += PAGE_LIMIT;
      await setSyncProgress(accountUserId, {
        syncPhase: "expenses",
        syncProgressSynced: synced,
      });
      if (expenses.length < PAGE_LIMIT) break;
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.expenses)
      .where(eq(schema.expenses.accountUserId, accountUserId));

    await setSyncStatus(accountUserId, {
      expensesStatus: "idle",
      expensesError: null,
      expensesLastSyncAt: new Date(),
      expensesUpdatedAfter: maxUpdatedAt ?? new Date(),
      expenseCount: total,
      syncPhase: null,
      syncProgressSynced: 0,
      syncProgressLabel: null,
    });

    return { synced, total };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.cause instanceof Error
          ? `${err.message}: ${err.cause.message}`
          : err.message
        : "sync_failed";
    await setSyncStatus(accountUserId, {
      expensesStatus: "error",
      expensesError: message.slice(0, 500),
    });
    await clearSyncProgress(accountUserId);
    throw err;
  } finally {
    releaseExpenseSync(accountUserId);
  }
}

export async function getExpenseSyncStatus(accountUserId: number): Promise<{
  status: "idle" | "syncing" | "error";
  lastSyncAt: Date | null;
  expenseCount: number;
  error: string | null;
  progress: SyncProgress | null;
}> {
  await reconcileStaleSyncState(accountUserId);

  const db = getDb();
  const [state] = await db
    .select()
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, accountUserId))
    .limit(1);

  if (!state) {
    return {
      status: "idle",
      lastSyncAt: null,
      expenseCount: 0,
      error: null,
      progress: null,
    };
  }

  return {
    status: state.expensesStatus as "idle" | "syncing" | "error",
    lastSyncAt: state.expensesLastSyncAt,
    expenseCount: state.expenseCount,
    error: state.expensesError,
    progress: readSyncProgress(state),
  };
}
