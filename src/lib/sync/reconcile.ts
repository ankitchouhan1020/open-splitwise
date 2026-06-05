import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { isAnySyncInProgress } from "@/lib/sync/lock";
import { clearSyncProgress } from "@/lib/sync/progress";
import { isStaleSyncState } from "@/lib/sync/stale-sync";

export { isStaleSyncState } from "@/lib/sync/stale-sync";

/** Clears orphaned sync flags so the UI is not stuck after an interrupted run. */
export async function reconcileStaleSyncState(
  accountUserId: number,
): Promise<boolean> {
  if (isAnySyncInProgress(accountUserId)) return false;

  const db = getDb();
  const [state] = await db
    .select({
      expensesStatus: schema.syncState.expensesStatus,
      syncPhase: schema.syncState.syncPhase,
    })
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, accountUserId))
    .limit(1);

  if (!isStaleSyncState(state, false)) return false;

  if (state!.expensesStatus === "syncing") {
    await db
      .update(schema.syncState)
      .set({
        expensesStatus: "idle",
        expensesError: null,
      })
      .where(eq(schema.syncState.accountUserId, accountUserId));
  }

  if (state!.syncPhase != null) {
    await clearSyncProgress(accountUserId);
  }

  return true;
}
