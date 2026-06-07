import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

type RawExpenseUser = {
  user_id: number;
  user?: { id?: number; first_name?: string; last_name?: string };
};

export function formatSplitwiseUserName(
  first?: string | null,
  last?: string | null,
  fallbackId?: number,
): string {
  const name = [first, last].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (fallbackId != null) return `User ${fallbackId}`;
  return "—";
}

export function isPlaceholderUserName(name: string): boolean {
  return /^User \d+$/.test(name.trim());
}

/** Names embedded in a synced expense `raw` payload from Splitwise. */
export function participantNamesFromExpenseRaw(
  raw: unknown,
): Map<number, string> {
  const map = new Map<number, string>();
  if (!raw || typeof raw !== "object") return map;

  const users = (raw as { users?: RawExpenseUser[] }).users;
  if (!Array.isArray(users)) return map;

  for (const entry of users) {
    const id = entry.user_id ?? entry.user?.id;
    if (id == null) continue;
    map.set(
      id,
      formatSplitwiseUserName(
        entry.user?.first_name,
        entry.user?.last_name,
        id,
      ),
    );
  }

  return map;
}

function setNameIfBetter(
  names: Map<number, string>,
  userId: number,
  candidate: string,
): void {
  const existing = names.get(userId);
  if (!existing || isPlaceholderUserName(existing)) {
    if (!isPlaceholderUserName(candidate)) {
      names.set(userId, candidate);
    } else if (!existing) {
      names.set(userId, candidate);
    }
  }
}

/**
 * Resolve Splitwise user ids to display names using friends, group members,
 * the connected account, and names stored on synced expenses.
 */
export async function resolveSplitwiseUserNames(
  accountUserId: number,
  userIds: Iterable<number>,
  options?: { groupSplitwiseId?: number },
): Promise<Map<number, string>> {
  const ids = [...new Set(userIds)].filter(
    (id) => Number.isFinite(id) && id > 0,
  );
  const names = new Map<number, string>();
  if (ids.length === 0) return names;

  const db = getDb();

  const [ownerRow, friendRows] = await Promise.all([
    db
      .select({
        id: schema.users.splitwiseId,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
      })
      .from(schema.users)
      .where(eq(schema.users.id, accountUserId))
      .limit(1),
    db
      .select({
        id: schema.friends.splitwiseId,
        firstName: schema.friends.firstName,
        lastName: schema.friends.lastName,
      })
      .from(schema.friends)
      .where(eq(schema.friends.accountUserId, accountUserId)),
  ]);

  const owner = ownerRow[0];
  if (owner) {
    setNameIfBetter(
      names,
      owner.id,
      formatSplitwiseUserName(owner.firstName, owner.lastName, owner.id),
    );
  }

  for (const friend of friendRows) {
    setNameIfBetter(
      names,
      friend.id,
      formatSplitwiseUserName(friend.firstName, friend.lastName, friend.id),
    );
  }

  if (options?.groupSplitwiseId != null) {
    const memberRows = await db
      .select({
        splitwiseUserId: schema.groupMembers.splitwiseUserId,
        name: schema.groupMembers.name,
      })
      .from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.accountUserId, accountUserId),
          eq(schema.groupMembers.groupSplitwiseId, options.groupSplitwiseId),
        ),
      );

    for (const member of memberRows) {
      setNameIfBetter(names, member.splitwiseUserId, member.name);
    }

    const expenseRows = await db
      .select({ raw: schema.expenses.raw })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.accountUserId, accountUserId),
          eq(schema.expenses.groupId, options.groupSplitwiseId),
          isNull(schema.expenses.deletedAt),
        ),
      );

    for (const row of expenseRows) {
      for (const [userId, name] of participantNamesFromExpenseRaw(row.raw)) {
        if (ids.includes(userId)) {
          setNameIfBetter(names, userId, name);
        }
      }
    }
  }

  for (const id of ids) {
    if (!names.has(id)) {
      names.set(id, `User ${id}`);
    }
  }

  return names;
}

/** Load names for every participant seen on group expenses (fallback settle path). */
export async function resolveGroupParticipantNames(
  accountUserId: number,
  groupSplitwiseId: number,
): Promise<Map<number, string>> {
  const db = getDb();
  const shareRows = await db
    .select({ splitwiseUserId: schema.expenseShares.splitwiseUserId })
    .from(schema.expenseShares)
    .innerJoin(
      schema.expenses,
      eq(schema.expenseShares.expenseId, schema.expenses.id),
    )
    .where(
      and(
        eq(schema.expenses.accountUserId, accountUserId),
        eq(schema.expenses.groupId, groupSplitwiseId),
        isNull(schema.expenses.deletedAt),
      ),
    );

  const userIds = shareRows.map((row) => row.splitwiseUserId);
  return resolveSplitwiseUserNames(accountUserId, userIds, {
    groupSplitwiseId,
  });
}
