import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type { SyncRunContext } from "@/lib/sync/context";
import type {
  SplitwiseCategoriesResponse,
  SplitwiseCategory,
  SplitwiseFriendsResponse,
  SplitwiseGroupsResponse,
} from "@/lib/splitwise/types";
import { syncAllGroupBalancesForAccount } from "@/lib/groups/sync-balances";
import { releaseMetadataSync, tryAcquireMetadataSync } from "@/lib/sync/lock";
import { clearSyncProgress, setSyncProgress } from "@/lib/sync/progress";
import { reconcileStaleSyncState } from "@/lib/sync/reconcile";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Splitwise may omit or null out name fields; DB columns are NOT NULL text. */
function normalizeName(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "";
}

async function upsertCategory(
  category: SplitwiseCategory,
  parentId: number | null,
) {
  const db = getDb();
  await db
    .insert(schema.categories)
    .values({
      splitwiseId: category.id,
      name: category.name,
      parentSplitwiseId: parentId,
      raw: category,
      syncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.categories.splitwiseId,
      set: {
        name: category.name,
        parentSplitwiseId: parentId,
        raw: category,
        syncedAt: new Date(),
      },
    });

  if (category.subcategories?.length) {
    for (const sub of category.subcategories) {
      await upsertCategory(sub, category.id);
    }
  }
}

export async function syncMetadata(ctx: SyncRunContext): Promise<{
  groups: number;
  friends: number;
  categories: number;
}> {
  const { accountUserId, accessToken } = ctx;

  await reconcileStaleSyncState(accountUserId);

  if (!(await tryAcquireMetadataSync(accountUserId))) {
    throw new Error("Metadata sync already in progress");
  }

  const client = createSplitwiseClient(accessToken);
  const db = getDb();
  const now = new Date();

  try {
    await setSyncProgress(accountUserId, {
      syncPhase: "metadata",
      syncProgressLabel: "groups",
      syncProgressSynced: 0,
    });

    const { groups } = await client.get<SplitwiseGroupsResponse>("get_groups");
    for (const group of groups ?? []) {
      const groupName = normalizeName(group.name) || `Group #${group.id}`;
      await db
        .insert(schema.groups)
        .values({
          accountUserId,
          splitwiseId: group.id,
          name: groupName,
          groupType: group.group_type,
          updatedAt: parseDate(group.updated_at),
          raw: group,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: [schema.groups.accountUserId, schema.groups.splitwiseId],
          set: {
            name: groupName,
            groupType: group.group_type,
            updatedAt: parseDate(group.updated_at),
            raw: group,
            syncedAt: now,
          },
        });
    }

    await setSyncProgress(accountUserId, { syncProgressLabel: "friends" });

    const { friends } =
      await client.get<SplitwiseFriendsResponse>("get_friends");
    for (const friend of friends ?? []) {
      const firstName = normalizeName(friend.first_name);
      const lastName = normalizeName(friend.last_name);
      await db
        .insert(schema.friends)
        .values({
          accountUserId,
          splitwiseId: friend.id,
          firstName,
          lastName,
          email: friend.email,
          updatedAt: parseDate(friend.updated_at),
          raw: friend,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: [schema.friends.accountUserId, schema.friends.splitwiseId],
          set: {
            firstName,
            lastName,
            email: friend.email,
            updatedAt: parseDate(friend.updated_at),
            raw: friend,
            syncedAt: now,
          },
        });
    }

    await setSyncProgress(accountUserId, { syncProgressLabel: "categories" });

    const { categories } =
      await client.get<SplitwiseCategoriesResponse>("get_categories");
    let categoryCount = 0;
    for (const cat of categories ?? []) {
      await upsertCategory(cat, null);
      categoryCount += 1;
      categoryCount += cat.subcategories?.length ?? 0;
    }

    await setSyncProgress(accountUserId, {
      syncProgressLabel: "group balances",
    });
    await syncAllGroupBalancesForAccount(ctx);

    await db
      .update(schema.syncState)
      .set({
        groupsLastSyncAt: now,
        friendsLastSyncAt: now,
        categoriesLastSyncAt: now,
      })
      .where(eq(schema.syncState.accountUserId, accountUserId));

    await clearSyncProgress(accountUserId);

    return {
      groups: groups?.length ?? 0,
      friends: friends?.length ?? 0,
      categories: categoryCount,
    };
  } finally {
    await clearSyncProgress(accountUserId).catch(() => undefined);
    await releaseMetadataSync(accountUserId);
  }
}
