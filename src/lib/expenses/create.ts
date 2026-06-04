import { and, eq } from "drizzle-orm";
import { requireAccessToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getAccountOwner } from "@/lib/db/account";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type { SplitwiseCreateExpenseResponse } from "@/lib/splitwise/types";
import { upsertExpense } from "@/lib/sync/expenses";

export type CreateExpenseInput = {
  groupId: number;
  description: string;
  cost: string;
  currencyCode: string;
  categoryId?: number;
  date?: string;
  details?: string;
};

export async function createGroupExpense(
  input: CreateExpenseInput,
): Promise<
  | { ok: true; expenseId: number; splitwiseId: number }
  | { error: string; details?: Record<string, string[]> }
> {
  const owner = await getAccountOwner();
  if (!owner) return { error: "not_connected" };

  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const body: Record<string, unknown> = {
    group_id: input.groupId,
    description: input.description.trim(),
    cost: input.cost,
    currency_code: input.currencyCode,
    split_equally: true,
  };
  if (input.categoryId) body.category_id = input.categoryId;
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

  await upsertExpense(owner.id, expense);
  const db = getDb();
  const [row] = await db
    .select({ id: schema.expenses.id })
    .from(schema.expenses)
    .where(
      and(
        eq(schema.expenses.accountUserId, owner.id),
        eq(schema.expenses.splitwiseId, expense.id),
      ),
    )
    .limit(1);

  return {
    ok: true,
    expenseId: row?.id ?? 0,
    splitwiseId: expense.id,
  };
}
