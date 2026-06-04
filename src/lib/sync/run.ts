import {
  isExpenseSyncInProgress,
  isMetadataSyncInProgress,
} from "@/lib/sync/lock";
import { reconcileStaleSyncState } from "@/lib/sync/reconcile";
import { syncExpenses } from "@/lib/sync/expenses";
import { syncMetadata } from "@/lib/sync/metadata";
import type { SyncRunContext, SyncScope } from "@/lib/sync/context";

export class SyncAlreadyInProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncAlreadyInProgressError";
  }
}

export async function assertSyncCanStart(
  accountUserId: number,
  scope: SyncScope,
): Promise<void> {
  await reconcileStaleSyncState(accountUserId);

  if ((scope === "all" || scope === "metadata") && isMetadataSyncInProgress()) {
    throw new SyncAlreadyInProgressError("Metadata sync already in progress");
  }

  if ((scope === "all" || scope === "expenses") && isExpenseSyncInProgress()) {
    throw new SyncAlreadyInProgressError("Expense sync already in progress");
  }
}

export async function runSyncJob(params: {
  scope: SyncScope;
  ctx: SyncRunContext;
}): Promise<void> {
  const { scope, ctx } = params;

  try {
    if (scope === "all" || scope === "metadata") {
      await syncMetadata(ctx);
    }
    if (scope === "all" || scope === "expenses") {
      await syncExpenses(ctx);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("already in progress")) return;
    console.error("[sync] job failed:", err);
  }
}
