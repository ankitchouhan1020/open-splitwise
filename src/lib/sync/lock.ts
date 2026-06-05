/** Per-tenant in-memory sync locks (multiple Splitwise users per deployment). */

const expenseSyncInProgress = new Set<number>();
const metadataSyncInProgress = new Set<number>();

export function tryAcquireExpenseSync(accountUserId: number): boolean {
  if (expenseSyncInProgress.has(accountUserId)) return false;
  expenseSyncInProgress.add(accountUserId);
  return true;
}

export function releaseExpenseSync(accountUserId: number): void {
  expenseSyncInProgress.delete(accountUserId);
}

export function tryAcquireMetadataSync(accountUserId: number): boolean {
  if (metadataSyncInProgress.has(accountUserId)) return false;
  metadataSyncInProgress.add(accountUserId);
  return true;
}

export function releaseMetadataSync(accountUserId: number): void {
  metadataSyncInProgress.delete(accountUserId);
}

export function isExpenseSyncInProgress(accountUserId: number): boolean {
  return expenseSyncInProgress.has(accountUserId);
}

export function isMetadataSyncInProgress(accountUserId: number): boolean {
  return metadataSyncInProgress.has(accountUserId);
}

export function isAnySyncInProgress(accountUserId: number): boolean {
  return (
    expenseSyncInProgress.has(accountUserId) ||
    metadataSyncInProgress.has(accountUserId)
  );
}
