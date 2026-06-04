let expenseSyncInProgress = false;
let metadataSyncInProgress = false;

export function tryAcquireExpenseSync(): boolean {
  if (expenseSyncInProgress) return false;
  expenseSyncInProgress = true;
  return true;
}

export function releaseExpenseSync(): void {
  expenseSyncInProgress = false;
}

export function tryAcquireMetadataSync(): boolean {
  if (metadataSyncInProgress) return false;
  metadataSyncInProgress = true;
  return true;
}

export function releaseMetadataSync(): void {
  metadataSyncInProgress = false;
}

export function isExpenseSyncInProgress(): boolean {
  return expenseSyncInProgress;
}

export function isMetadataSyncInProgress(): boolean {
  return metadataSyncInProgress;
}

export function isAnySyncInProgress(): boolean {
  return expenseSyncInProgress || metadataSyncInProgress;
}
