import { and, eq } from "drizzle-orm";
import { requireAccessToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import {
  buildEqualSplitUsersBody,
  canUseSplitEqually,
} from "@/lib/expenses/splits";
import { fetchGroupMembers } from "@/lib/groups/members";
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
  participantIds?: number[];
  paidByUserId?: number;
};

export async function createGroupExpense(
  input: CreateExpenseInput,
): Promise<
  | { ok: true; expenseId: number; splitwiseId: number }
  | { error: string; details?: Record<string, string[]> }
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  return createGroupExpenseForOwner(owner, input);
}

async function createGroupExpenseForOwner(
  owner: { id: number; splitwiseId: number },
  input: CreateExpenseInput,
): Promise<
  | { ok: true; expenseId: number; splitwiseId: number }
  | { error: string; details?: Record<string, string[]> }
> {
  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const body: Record<string, unknown> = {
    group_id: input.groupId,
    description: input.description.trim(),
    cost: input.cost,
    currency_code: input.currencyCode,
  };
  if (input.categoryId) body.category_id = input.categoryId;
  if (input.date) body.date = input.date;
  if (input.details?.trim()) body.details = input.details.trim();

  const hasCustomSplit =
    (input.participantIds?.length ?? 0) > 0 || input.paidByUserId != null;

  if (hasCustomSplit) {
    const membersResult = await fetchGroupMembers(input.groupId);
    if ("error" in membersResult) {
      return { error: membersResult.error };
    }
    const allMemberIds = membersResult.map((m) => m.id);
    const participantIds =
      input.participantIds && input.participantIds.length > 0
        ? input.participantIds
        : allMemberIds;
    const paidByUserId = input.paidByUserId ?? owner.splitwiseId;

    if (
      canUseSplitEqually(
        allMemberIds,
        participantIds,
        paidByUserId,
        owner.splitwiseId,
      )
    ) {
      body.split_equally = true;
    } else {
      try {
        Object.assign(
          body,
          buildEqualSplitUsersBody(paidByUserId, participantIds, input.cost),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "invalid_split";
        return { error: message };
      }
    }
  } else {
    body.split_equally = true;
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
    const result = await createGroupExpenseForOwner(owner, {
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
