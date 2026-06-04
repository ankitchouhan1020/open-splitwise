import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAccountOwner } from "@/lib/db/account";
import { requireAccessToken } from "@/lib/auth";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type {
  SplitwiseCategoriesResponse,
  SplitwiseCategory,
  SplitwiseFriendsResponse,
  SplitwiseGroupsResponse,
} from "@/lib/splitwise/types";
import { releaseMetadataSync, tryAcquireMetadataSync } from "@/lib/sync/lock";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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

export async function syncMetadata(): Promise<{
  groups: number;
  friends: number;
  categories: number;
}> {
  if (!tryAcquireMetadataSync()) {
    throw new Error("Metadata sync already in progress");
  }

  const owner = await getAccountOwner();
  if (!owner) {
    releaseMetadataSync();
    throw new Error("No connected account in database. Reconnect Splitwise.");
  }

  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);
  const db = getDb();
  const now = new Date();

  try {
    const { groups } = await client.get<SplitwiseGroupsResponse>("get_groups");
    for (const group of groups ?? []) {
      await db
        .insert(schema.groups)
        .values({
          accountUserId: owner.id,
          splitwiseId: group.id,
          name: group.name,
          groupType: group.group_type,
          updatedAt: parseDate(group.updated_at),
          raw: group,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: [schema.groups.accountUserId, schema.groups.splitwiseId],
          set: {
            name: group.name,
            groupType: group.group_type,
            updatedAt: parseDate(group.updated_at),
            raw: group,
            syncedAt: now,
          },
        });
    }

    const { friends } =
      await client.get<SplitwiseFriendsResponse>("get_friends");
    for (const friend of friends ?? []) {
      await db
        .insert(schema.friends)
        .values({
          accountUserId: owner.id,
          splitwiseId: friend.id,
          firstName: friend.first_name,
          lastName: friend.last_name,
          email: friend.email,
          updatedAt: parseDate(friend.updated_at),
          raw: friend,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: [schema.friends.accountUserId, schema.friends.splitwiseId],
          set: {
            firstName: friend.first_name,
            lastName: friend.last_name,
            email: friend.email,
            updatedAt: parseDate(friend.updated_at),
            raw: friend,
            syncedAt: now,
          },
        });
    }

    const { categories } =
      await client.get<SplitwiseCategoriesResponse>("get_categories");
    let categoryCount = 0;
    for (const cat of categories ?? []) {
      await upsertCategory(cat, null);
      categoryCount += 1;
      categoryCount += cat.subcategories?.length ?? 0;
    }

    await db
      .update(schema.syncState)
      .set({
        groupsLastSyncAt: now,
        friendsLastSyncAt: now,
        categoriesLastSyncAt: now,
      })
      .where(eq(schema.syncState.accountUserId, owner.id));

    return {
      groups: groups?.length ?? 0,
      friends: friends?.length ?? 0,
      categories: categoryCount,
    };
  } finally {
    releaseMetadataSync();
  }
}
