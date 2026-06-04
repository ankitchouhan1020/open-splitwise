import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function upsertAccountOwner(user: {
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

export async function getAccountOwner() {
  const db = getDb();
  const [owner] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.isAccountOwner, true))
    .limit(1);
  return owner ?? null;
}

/** Removes all synced data for the connected account (used on disconnect). */
export async function clearAccountData(accountUserId: number) {
  const db = getDb();
  await db.delete(schema.users).where(eq(schema.users.id, accountUserId));
}

export async function clearAccountDataBySplitwiseId(splitwiseUserId: number) {
  const [owner] = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.splitwiseId, splitwiseUserId))
    .limit(1);
  if (owner) {
    await clearAccountData(owner.id);
  }
}
