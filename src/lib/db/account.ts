import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAppSession, sessionHasAccessToken } from "@/lib/session";

/** Upsert the Splitwise user for the current OAuth session (one row per splitwise_id). */
export async function upsertConnectedUser(user: {
  splitwiseId: number;
  firstName: string;
  lastName: string;
  email: string;
  defaultCurrency: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.splitwiseId, user.splitwiseId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(schema.users)
      .set({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        defaultCurrency: user.defaultCurrency,
        isAccountOwner: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      splitwiseId: user.splitwiseId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      defaultCurrency: user.defaultCurrency,
      isAccountOwner: true,
    })
    .returning();

  await db.insert(schema.syncState).values({ accountUserId: created.id });

  return created;
}

/** @deprecated Use upsertConnectedUser */
export const upsertAccountOwner = upsertConnectedUser;

/**
 * DB user for the current session. Each browser session maps to one Splitwise
 * account via session.splitwiseUserId; data is isolated by users.id (account_user_id).
 */
export async function getAuthenticatedAccount() {
  const session = await getAppSession();
  if (!sessionHasAccessToken(session) || !session.splitwiseUserId) {
    return null;
  }

  const db = getDb();
  const [account] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.splitwiseId, session.splitwiseUserId))
    .limit(1);
  return account ?? null;
}

/** @deprecated Use getAuthenticatedAccount */
export const getAuthenticatedAccountOwner = getAuthenticatedAccount;

/** Removes all synced data for a Splitwise user (explicit delete in Settings). */
export async function clearAccountData(accountUserId: number) {
  const db = getDb();
  await db.delete(schema.users).where(eq(schema.users.id, accountUserId));
}

export async function clearAccountDataBySplitwiseId(splitwiseUserId: number) {
  const [account] = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.splitwiseId, splitwiseUserId))
    .limit(1);
  if (account) {
    await clearAccountData(account.id);
  }
}
