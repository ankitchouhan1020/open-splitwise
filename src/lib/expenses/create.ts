import "server-only";

import { and, eq } from "drizzle-orm";
import { requireAccessToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import type { ExpenseWriteInput } from "@/lib/expenses/request-body";
import { applySplitToBody } from "@/lib/expenses/split-request";
import { buildSettlementUsersBody } from "@/lib/expenses/splits";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type {
  SplitwiseCreateExpenseResponse,
  SplitwiseExpense,
} from "@/lib/splitwise/types";
import { upsertExpense } from "@/lib/sync/expenses";
import { refreshGroupBalanceForAccount } from "@/lib/groups/sync-balances";

export type CreateExpenseResult =
  | { ok: true; expenseId: number; splitwiseId: number }
  | { error: string; details?: Record<string, string[]> };

async function refreshGroupBalanceAfterWrite(
  accountUserId: number,
  accessToken: string,
  groupId?: number,
): Promise<void> {
  if (!groupId) return;
  try {
    await refreshGroupBalanceForAccount({
      accountUserId,
      accessToken,
      groupSplitwiseId: groupId,
    });
  } catch (err) {
    console.error("[expenses] group balance refresh failed:", err);
  }
}

async function persistCreatedExpense(
  ownerId: number,
  expense: SplitwiseExpense,
): Promise<{ expenseId: number; splitwiseId: number }> {
  await upsertExpense(ownerId, expense);
  const db = getDb();
  const [row] = await db
    .select({ id: schema.expenses.id })
    .from(schema.expenses)
    .where(
      and(
        eq(schema.expenses.accountUserId, ownerId),
        eq(schema.expenses.splitwiseId, expense.id),
      ),
    )
    .limit(1);

  return {
    expenseId: row?.id ?? 0,
    splitwiseId: expense.id,
  };
}

async function createExpenseForOwner(
  owner: { id: number; splitwiseId: number },
  input: ExpenseWriteInput,
): Promise<CreateExpenseResult> {
  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const body: Record<string, unknown> = {
    description: input.description.trim(),
    cost: input.cost,
    currency_code: input.currencyCode,
    payment: false,
  };

  if (input.groupId) {
    body.group_id = input.groupId;
  } else if (input.friendUserId) {
    body.group_id = 0;
  }

  if (input.categoryId) body.category_id = input.categoryId;
  if (input.date) body.date = input.date;
  if (input.details?.trim()) body.details = input.details.trim();

  const splitResult = await applySplitToBody(body, {
    groupId: input.groupId,
    friendUserId: input.friendUserId,
    cost: input.cost,
    ownerSplitwiseId: owner.splitwiseId,
    participantIds: input.participantIds,
    paidByUserId: input.paidByUserId,
    splitMode: input.splitMode,
    memberSplits: input.memberSplits,
  });
  if ("error" in splitResult) {
    return { error: splitResult.error };
  }

  const result = await client.post<SplitwiseCreateExpenseResponse>(
    "create_expense",
    body,
  );

  if (result.errors && Object.keys(result.errors).length > 0) {
    return { error: "splitwise_validation", details: result.errors };
  }

  const expense = result.expenses?.[0];
  if (!expense) {
    return { error: "no_expense_returned" };
  }

  const persisted = await persistCreatedExpense(owner.id, expense);
  await refreshGroupBalanceAfterWrite(owner.id, token, input.groupId);
  return { ok: true, ...persisted };
}

export async function createExpense(
  input: ExpenseWriteInput,
): Promise<CreateExpenseResult> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };
  return createExpenseForOwner(owner, input);
}

/** @deprecated Use createExpense */
export type CreateExpenseInput = ExpenseWriteInput & { groupId: number };

export async function createGroupExpense(
  input: CreateExpenseInput,
): Promise<CreateExpenseResult> {
  return createExpense(input);
}

export type BulkCreateExpenseItem = {
  description: string;
  cost: string;
};

export type BulkCreateExpenseResult = {
  ok: true;
  created: number;
  failed: number;
  results: Array<
    | {
        index: number;
        description: string;
        cost: string;
        ok: true;
        splitwiseId: number;
        expenseId: number;
      }
    | {
        index: number;
        description: string;
        cost: string;
        ok: false;
        error: string;
        details?: Record<string, string[]>;
      }
  >;
};

const BULK_MAX = 50;

export async function createGroupExpensesBulk(
  groupId: number,
  currencyCode: string,
  items: BulkCreateExpenseItem[],
  options?: {
    categoryId?: number;
    date?: string;
    participantIds?: number[];
    paidByUserId?: number;
  },
): Promise<
  | BulkCreateExpenseResult
  | { error: string; details?: Record<string, string[]> }
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  if (items.length === 0) {
    return { error: "empty_batch" };
  }
  if (items.length > BULK_MAX) {
    return { error: "batch_too_large", details: { limit: [String(BULK_MAX)] } };
  }

  const results: BulkCreateExpenseResult["results"] = [];
  let created = 0;
  let failed = 0;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const result = await createExpenseForOwner(owner, {
      groupId,
      description: item.description,
      cost: item.cost,
      currencyCode,
      categoryId: options?.categoryId,
      date: options?.date,
      participantIds: options?.participantIds,
      paidByUserId: options?.paidByUserId,
    });

    if ("ok" in result && result.ok) {
      created++;
      results.push({
        index,
        description: item.description,
        cost: item.cost,
        ok: true,
        splitwiseId: result.splitwiseId,
        expenseId: result.expenseId,
      });
    } else {
      failed++;
      results.push({
        index,
        description: item.description,
        cost: item.cost,
        ok: false,
        error: "error" in result ? result.error : "create_failed",
        details: "details" in result ? result.details : undefined,
      });
    }
  }

  return { ok: true, created, failed, results };
}

export type RecordSettlementInput = {
  friendUserId: number;
  cost: string;
  currencyCode: string;
  payerUserId: number;
  payeeUserId: number;
  description?: string;
  date?: string;
  details?: string;
  groupId?: number;
};

export async function recordSettlement(
  input: RecordSettlementInput,
): Promise<CreateExpenseResult> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const body: Record<string, unknown> = {
    payment: true,
    cost: input.cost,
    currency_code: input.currencyCode,
    description: input.description?.trim() || "Payment",
    ...buildSettlementUsersBody(
      input.payerUserId,
      input.payeeUserId,
      input.cost,
    ),
  };

  if (input.groupId) {
    body.group_id = input.groupId;
  } else {
    body.group_id = 0;
  }

  if (input.date) body.date = input.date;
  if (input.details?.trim()) body.details = input.details.trim();

  const result = await client.post<SplitwiseCreateExpenseResponse>(
    "create_expense",
    body,
  );

  if (result.errors && Object.keys(result.errors).length > 0) {
    return { error: "splitwise_validation", details: result.errors };
  }

  const expense = result.expenses?.[0];
  if (!expense) {
    return { error: "no_expense_returned" };
  }

  const persisted = await persistCreatedExpense(owner.id, expense);
  await refreshGroupBalanceAfterWrite(owner.id, token, input.groupId);
  return { ok: true, ...persisted };
}
