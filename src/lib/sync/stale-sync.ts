type SyncStateRow = {
  expensesStatus: string;
  syncPhase: string | null;
};

/** DB says syncing but no worker holds the lock (deploy, timeout, crash). */
export function isStaleSyncState(
  state: SyncStateRow | null | undefined,
  syncInProgress: boolean,
): boolean {
  if (syncInProgress || !state) return false;
  return state.expensesStatus === "syncing" || state.syncPhase != null;
}
