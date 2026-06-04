import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export type SyncProgress = {
  phase: "metadata" | "expenses";
  synced: number;
  label: string | null;
};

export async function ensureSyncState(accountUserId: number): Promise<void> {
  const db = getDb();
  await db
    .insert(schema.syncState)
    .values({ accountUserId })
    .onConflictDoNothing();
}

export async function setSyncProgress(
  accountUserId: number,
  patch: Partial<{
    syncPhase: string | null;
    syncProgressSynced: number;
    syncProgressLabel: string | null;
  }>,
): Promise<void> {
  await ensureSyncState(accountUserId);
  await getDb()
    .update(schema.syncState)
    .set(patch)
    .where(eq(schema.syncState.accountUserId, accountUserId));
}

export async function clearSyncProgress(accountUserId: number): Promise<void> {
  await setSyncProgress(accountUserId, {
    syncPhase: null,
    syncProgressSynced: 0,
    syncProgressLabel: null,
  });
}

export function readSyncProgress(state: {
  syncPhase: string | null;
  syncProgressSynced: number;
  syncProgressLabel: string | null;
}): SyncProgress | null {
  if (state.syncPhase !== "metadata" && state.syncPhase !== "expenses") {
    return null;
  }
  return {
    phase: state.syncPhase,
    synced: state.syncProgressSynced,
    label: state.syncProgressLabel,
  };
}
