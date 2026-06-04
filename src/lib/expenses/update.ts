import { and, eq } from "drizzle-orm";
import { requireAccessToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type {
  SplitwiseCreateExpenseResponse,
  SplitwiseDeleteExpenseResponse,
} from "@/lib/splitwise/types";
import { upsertExpense } from "@/lib/sync/expenses";

export type UpdateExpenseInput = {
  description: string;
  cost: string;
  currencyCode: string;
  categoryId?: number;
  date?: string;
  details?: string;
};

type ExpenseRow = {
  id: number;
  splitwiseId: number;
  groupId: number | null;
  payment: boolean;
};

async function resolveGroupExpenseForMutation(
  expenseId: number,
): Promise<{ ok: true; ownerId: number; row: ExpenseRow } | { error: string }> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  const db = getDb();
  const [row] = await db
    .select({
      id: schema.expenses.id,
      splitwiseId: schema.expenses.splitwiseId,
      groupId: schema.expenses.groupId,
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
  if (!row.groupId || row.groupId <= 0) {
    return { error: "group_expense_only" };
  }

  return { ok: true, ownerId: owner.id, row };
}

export async function updateGroupExpense(
  expenseId: number,
  input: UpdateExpenseInput,
): Promise<
  | { ok: true; expenseId: number; splitwiseId: number }
  | { error: string; details?: Record<string, string[]> }
> {
  const resolved = await resolveGroupExpenseForMutation(expenseId);
  if ("error" in resolved) return resolved;

  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const body: Record<string, unknown> = {
    description: input.description.trim(),
    cost: input.cost,
    currency_code: input.currencyCode,
    split_equally: true,
  };
  if (input.categoryId) body.category_id = input.categoryId;
  if (input.date) body.date = input.date;
  body.details = input.details?.trim() ?? "";

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

  await upsertExpense(resolved.ownerId, expense);

  return {
    ok: true,
    expenseId: resolved.row.id,
    splitwiseId: expense.id,
  };
}

export async function deleteGroupExpense(
  expenseId: number,
): Promise<
  { ok: true } | { error: string; details?: Record<string, string[]> }
> {
  const resolved = await resolveGroupExpenseForMutation(expenseId);
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
        eq(schema.expenses.accountUserId, resolved.ownerId),
      ),
    );

  return { ok: true };
}
