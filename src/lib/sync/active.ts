import type { SyncProgress } from "@/lib/sync/progress";

export function isSyncActive(params: {
  lockHeld: boolean;
  expensesStatus: string;
  progress: SyncProgress | null;
}): boolean {
  return (
    params.lockHeld ||
    params.expensesStatus === "syncing" ||
    params.progress != null
  );
}
