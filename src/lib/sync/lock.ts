import { isDatabaseConfigured } from "@/lib/db/config";
import { getDb, getPostgresSql, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
/** Per-tenant sync locks — Postgres advisory locks when DB is available. */

const EXPENSE_LOCK_CLASS = 1;
const METADATA_LOCK_CLASS = 2;

type ReservedConnection = Awaited<
  ReturnType<ReturnType<typeof getPostgresSql>["reserve"]>
>;

const expenseHolders = new Map<number, ReservedConnection>();
const metadataHolders = new Map<number, ReservedConnection>();

const expenseMemory = new Set<number>();
const metadataMemory = new Set<number>();

async function tryAcquireAdvisory(
  accountUserId: number,
  lockClass: number,
  holders: Map<number, ReservedConnection>,
): Promise<boolean> {
  if (holders.has(accountUserId)) return false;

  const sql = getPostgresSql();
  const reserved = await sql.reserve();
  const [row] = await reserved<{ acquired: boolean }[]>`
    SELECT pg_try_advisory_lock(${accountUserId}, ${lockClass}) AS acquired
  `;
  if (!row?.acquired) {
    await reserved.release();
    return false;
  }
  holders.set(accountUserId, reserved);
  return true;
}

async function releaseAdvisory(
  accountUserId: number,
  lockClass: number,
  holders: Map<number, ReservedConnection>,
): Promise<void> {
  const reserved = holders.get(accountUserId);
  if (!reserved) return;
  await reserved`SELECT pg_advisory_unlock(${accountUserId}, ${lockClass})`;
  await reserved.release();
  holders.delete(accountUserId);
}

export async function tryAcquireExpenseSync(
  accountUserId: number,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    if (expenseMemory.has(accountUserId)) return false;
    expenseMemory.add(accountUserId);
    return true;
  }
  return tryAcquireAdvisory(accountUserId, EXPENSE_LOCK_CLASS, expenseHolders);
}

export async function releaseExpenseSync(accountUserId: number): Promise<void> {
  if (!isDatabaseConfigured()) {
    expenseMemory.delete(accountUserId);
    return;
  }
  await releaseAdvisory(accountUserId, EXPENSE_LOCK_CLASS, expenseHolders);
}

export async function tryAcquireMetadataSync(
  accountUserId: number,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    if (metadataMemory.has(accountUserId)) return false;
    metadataMemory.add(accountUserId);
    return true;
  }
  return tryAcquireAdvisory(
    accountUserId,
    METADATA_LOCK_CLASS,
    metadataHolders,
  );
}

export async function releaseMetadataSync(
  accountUserId: number,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    metadataMemory.delete(accountUserId);
    return;
  }
  await releaseAdvisory(accountUserId, METADATA_LOCK_CLASS, metadataHolders);
}

export async function isExpenseSyncInProgress(
  accountUserId: number,
): Promise<boolean> {
  if (expenseHolders.has(accountUserId) || expenseMemory.has(accountUserId)) {
    return true;
  }
  if (!isDatabaseConfigured()) return false;

  const db = getDb();
  const [state] = await db
    .select({ expensesStatus: schema.syncState.expensesStatus })
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, accountUserId))
    .limit(1);
  return state?.expensesStatus === "syncing";
}

export async function isMetadataSyncInProgress(
  accountUserId: number,
): Promise<boolean> {
  if (metadataHolders.has(accountUserId) || metadataMemory.has(accountUserId)) {
    return true;
  }
  if (!isDatabaseConfigured()) return false;

  const db = getDb();
  const [state] = await db
    .select({ syncPhase: schema.syncState.syncPhase })
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, accountUserId))
    .limit(1);
  return state?.syncPhase === "metadata";
}

export async function isAnySyncInProgress(
  accountUserId: number,
): Promise<boolean> {
  const [expense, metadata] = await Promise.all([
    isExpenseSyncInProgress(accountUserId),
    isMetadataSyncInProgress(accountUserId),
  ]);
  return expense || metadata;
}

/** Test helper — clears in-memory fallback locks between cases. */
export function resetMemorySyncLocksForTests(): void {
  expenseMemory.clear();
  metadataMemory.clear();
}
