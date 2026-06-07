import { and, eq } from "drizzle-orm";
import { requireAccessToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import type { ExpenseWriteInput } from "@/lib/expenses/request-body";
import { applySplitToBody } from "@/lib/expenses/split-request";
import { parseExpenseSplitState } from "@/lib/expenses/splits";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type {
  SplitwiseCreateExpenseResponse,
  SplitwiseDeleteExpenseResponse,
} from "@/lib/splitwise/types";
import { upsertExpense } from "@/lib/sync/expenses";

export type UpdateExpenseInput = Omit<
  ExpenseWriteInput,
  "groupId" | "friendUserId"
>;

type ExpenseRow = {
  id: number;
  splitwiseId: number;
  groupId: number | null;
  friendshipId: number | null;
  payment: boolean;
};

async function resolveMutableExpense(expenseId: number): Promise<
  | {
      ok: true;
      owner: { id: number; splitwiseId: number };
      row: ExpenseRow;
      shares: Array<{
        splitwiseUserId: number;
        paidShare: string;
        owedShare: string;
      }>;
    }
  | { error: string }
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  const db = getDb();
  const [row] = await db
    .select({
      id: schema.expenses.id,
      splitwiseId: schema.expenses.splitwiseId,
      groupId: schema.expenses.groupId,
      friendshipId: schema.expenses.friendshipId,
      payment: schema.expenses.payment,
    })
    .from(schema.expenses)
    .where(
      and(
        eq(schema.expenses.id, expenseId),
        eq(schema.expenses.accountUserId, owner.id),
      ),
    )
    .limit(1);

  if (!row) return { error: "not_found" };
  if (row.payment) return { error: "payment_not_editable" };

  const shares = await db
    .select({
      splitwiseUserId: schema.expenseShares.splitwiseUserId,
      paidShare: schema.expenseShares.paidShare,
      owedShare: schema.expenseShares.owedShare,
    })
    .from(schema.expenseShares)
    .where(eq(schema.expenseShares.expenseId, row.id));

  return { ok: true, owner, row, shares };
}

function friendUserIdFromShares(
  ownerSplitwiseId: number,
  shares: Array<{ splitwiseUserId: number }>,
): number | undefined {
  const other = shares.find((s) => s.splitwiseUserId !== ownerSplitwiseId);
  return other?.splitwiseUserId;
}

export async function updateExpense(
  expenseId: number,
  input: UpdateExpenseInput,
): Promise<
  | { ok: true; expenseId: number; splitwiseId: number }
  | { error: string; details?: Record<string, string[]> }
> {
  const resolved = await resolveMutableExpense(expenseId);
  if ("error" in resolved) return resolved;

  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const body: Record<string, unknown> = {
    description: input.description.trim(),
    cost: input.cost,
    currency_code: input.currencyCode,
  };
  if (input.categoryId) body.category_id = input.categoryId;
  if (input.date) body.date = input.date;
  body.details = input.details?.trim() ?? "";

  const groupId =
    resolved.row.groupId && resolved.row.groupId > 0
      ? resolved.row.groupId
      : undefined;
  const friendUserId = groupId
    ? undefined
    : friendUserIdFromShares(resolved.owner.splitwiseId, resolved.shares);

  const splitState = parseExpenseSplitState(resolved.shares);
  const participantIds =
    input.participantIds ??
    (splitState.participantIds.length > 0
      ? splitState.participantIds
      : undefined);

  const splitResult = await applySplitToBody(body, {
    groupId,
    friendUserId,
    cost: input.cost,
    ownerSplitwiseId: resolved.owner.splitwiseId,
    participantIds,
    paidByUserId: input.paidByUserId ?? splitState.paidByUserId ?? undefined,
    splitMode: input.splitMode,
    memberSplits: input.memberSplits,
  });
  if ("error" in splitResult) {
    return { error: splitResult.error };
  }

  const result = await client.post<SplitwiseCreateExpenseResponse>(
    `update_expense/${resolved.row.splitwiseId}`,
    body,
  );

  if (result.errors && Object.keys(result.errors).length > 0) {
    return { error: "splitwise_validation", details: result.errors };
  }

  const expense = result.expenses?.[0];
  if (!expense) {
    return { error: "no_expense_returned" };
  }

  await upsertExpense(resolved.owner.id, expense);

  return {
    ok: true,
    expenseId: resolved.row.id,
    splitwiseId: expense.id,
  };
}

/** @deprecated Use updateExpense */
export async function updateGroupExpense(
  expenseId: number,
  input: UpdateExpenseInput,
): Promise<
  | { ok: true; expenseId: number; splitwiseId: number }
  | { error: string; details?: Record<string, string[]> }
> {
  return updateExpense(expenseId, input);
}

export async function deleteExpense(
  expenseId: number,
): Promise<
  { ok: true } | { error: string; details?: Record<string, string[]> }
> {
  const resolved = await resolveMutableExpense(expenseId);
  if ("error" in resolved) return resolved;

  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const result = await client.post<SplitwiseDeleteExpenseResponse>(
    `delete_expense/${resolved.row.splitwiseId}`,
  );

  if (result.errors && Object.keys(result.errors).length > 0) {
    return { error: "splitwise_validation", details: result.errors };
  }

  if (!result.success) {
    return { error: "delete_failed" };
  }

  const db = getDb();
  const now = new Date();
  await db
    .update(schema.expenses)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(schema.expenses.id, resolved.row.id),
        eq(schema.expenses.accountUserId, resolved.owner.id),
      ),
    );

  return { ok: true };
}

/** @deprecated Use deleteExpense */
export async function deleteGroupExpense(
  expenseId: number,
): Promise<
  { ok: true } | { error: string; details?: Record<string, string[]> }
> {
  return deleteExpense(expenseId);
}
