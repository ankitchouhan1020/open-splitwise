import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type {
  SplitwiseGroupDetailResponse,
  SplitwiseGroupDetail,
} from "@/lib/splitwise/types";
import {
  activeGroupDebts,
  memberNameFromSplitwise,
  ownerNetFromGroupMembers,
  parseSplitwiseDebts,
} from "@/lib/groups/debt-model";
import {
  formatSplitwiseUserName,
  isPlaceholderUserName,
} from "@/lib/users/resolve-names";
import type { SyncRunContext } from "@/lib/sync/context";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function syncGroupBalanceFromSplitwise(params: {
  accountUserId: number;
  ownerSplitwiseId: number;
  defaultCurrency: string;
  accessToken: string;
  groupSplitwiseId: number;
}): Promise<boolean> {
  const client = createSplitwiseClient(params.accessToken);
  const data = await client.get<SplitwiseGroupDetailResponse>(
    `get_group/${params.groupSplitwiseId}`,
  );
  const group = data.group;
  if (!group) return false;

  await persistGroupBalanceSnapshot({
    accountUserId: params.accountUserId,
    ownerSplitwiseId: params.ownerSplitwiseId,
    defaultCurrency: params.defaultCurrency,
    group,
  });
  return true;
}

export async function syncAllGroupBalancesForAccount(
  ctx: SyncRunContext,
): Promise<number> {
  const db = getDb();
  const [owner] = await db
    .select({
      splitwiseId: schema.users.splitwiseId,
      defaultCurrency: schema.users.defaultCurrency,
    })
    .from(schema.users)
    .where(eq(schema.users.id, ctx.accountUserId))
    .limit(1);

  if (!owner) return 0;

  return syncAllGroupBalancesFromSplitwise({
    accountUserId: ctx.accountUserId,
    ownerSplitwiseId: owner.splitwiseId,
    defaultCurrency: owner.defaultCurrency,
    accessToken: ctx.accessToken,
  });
}

export async function refreshGroupBalanceForAccount(params: {
  accountUserId: number;
  accessToken: string;
  groupSplitwiseId: number;
}): Promise<void> {
  const db = getDb();
  const [owner] = await db
    .select({
      splitwiseId: schema.users.splitwiseId,
      defaultCurrency: schema.users.defaultCurrency,
    })
    .from(schema.users)
    .where(eq(schema.users.id, params.accountUserId))
    .limit(1);

  if (!owner) return;

  await syncGroupBalanceFromSplitwise({
    accountUserId: params.accountUserId,
    ownerSplitwiseId: owner.splitwiseId,
    defaultCurrency: owner.defaultCurrency,
    accessToken: params.accessToken,
    groupSplitwiseId: params.groupSplitwiseId,
  });
}

export async function syncAllGroupBalancesFromSplitwise(params: {
  accountUserId: number;
  ownerSplitwiseId: number;
  defaultCurrency: string;
  accessToken: string;
}): Promise<number> {
  const db = getDb();
  const groups = await db
    .select({ splitwiseId: schema.groups.splitwiseId })
    .from(schema.groups)
    .where(eq(schema.groups.accountUserId, params.accountUserId));

  let synced = 0;
  for (const group of groups) {
    const ok = await syncGroupBalanceFromSplitwise({
      ...params,
      groupSplitwiseId: group.splitwiseId,
    });
    if (ok) synced += 1;
  }
  return synced;
}

export async function persistGroupBalanceSnapshot(params: {
  accountUserId: number;
  ownerSplitwiseId: number;
  defaultCurrency: string;
  group: SplitwiseGroupDetail;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  const simplifyByDefault = params.group.simplify_by_default === true;
  const debts = parseSplitwiseDebts(
    activeGroupDebts({
      simplifyByDefault,
      originalDebts: params.group.original_debts,
      simplifiedDebts: params.group.simplified_debts,
    }),
  );
  const ownerNet = ownerNetFromGroupMembers(
    params.group.members ?? [],
    params.ownerSplitwiseId,
    params.defaultCurrency,
  );

  await db
    .update(schema.groups)
    .set({
      simplifyByDefault,
      ownerNetBalance: ownerNet != null ? String(ownerNet) : null,
      ownerNetBalanceCurrency: ownerNet != null ? params.defaultCurrency : null,
      balancesSyncedAt: now,
      updatedAt: parseDate(params.group.updated_at),
      raw: params.group,
      syncedAt: now,
    })
    .where(
      and(
        eq(schema.groups.accountUserId, params.accountUserId),
        eq(schema.groups.splitwiseId, params.group.id),
      ),
    );

  await db
    .delete(schema.groupDebts)
    .where(
      and(
        eq(schema.groupDebts.accountUserId, params.accountUserId),
        eq(schema.groupDebts.groupSplitwiseId, params.group.id),
      ),
    );

  if (debts.length > 0) {
    await db.insert(schema.groupDebts).values(
      debts.map((debt) => ({
        accountUserId: params.accountUserId,
        groupSplitwiseId: params.group.id,
        fromUserId: debt.fromUserId,
        toUserId: debt.toUserId,
        amount: String(debt.amount),
        currencyCode: debt.currencyCode,
        syncedAt: now,
      })),
    );
  }

  await db
    .delete(schema.groupMembers)
    .where(
      and(
        eq(schema.groupMembers.accountUserId, params.accountUserId),
        eq(schema.groupMembers.groupSplitwiseId, params.group.id),
      ),
    );

  const members = params.group.members ?? [];
  if (members.length > 0) {
    const friendRows = await db
      .select({
        id: schema.friends.splitwiseId,
        firstName: schema.friends.firstName,
        lastName: schema.friends.lastName,
      })
      .from(schema.friends)
      .where(eq(schema.friends.accountUserId, params.accountUserId));
    const friendNames = new Map(
      friendRows.map((friend) => [
        friend.id,
        formatSplitwiseUserName(friend.firstName, friend.lastName, friend.id),
      ]),
    );

    await db.insert(schema.groupMembers).values(
      members.map((member) => {
        let name = memberNameFromSplitwise(member);
        if (isPlaceholderUserName(name)) {
          const friendName = friendNames.get(member.id);
          if (friendName && !isPlaceholderUserName(friendName)) {
            name = friendName;
          }
        }
        return {
          accountUserId: params.accountUserId,
          groupSplitwiseId: params.group.id,
          splitwiseUserId: member.id,
          name,
          syncedAt: now,
        };
      }),
    );
  }
}
