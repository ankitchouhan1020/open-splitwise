import type { SyncStatus } from "@/components/sync-status-provider";
import { FetchJsonError } from "@/lib/query/fetch-json";

const DEFAULT_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 30 * 60_000;

type RefetchSyncStatus = () => Promise<{ data?: SyncStatus }>;

export async function waitForSyncComplete(
  refetch: RefetchSyncStatus,
  options?: { intervalMs?: number; timeoutMs?: number },
): Promise<SyncStatus> {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const { data } = await refetch();
    if (data && !data.inProgress) {
      if (data.expenses?.status === "error") {
        throw new FetchJsonError(data.expenses.error ?? "Sync failed", 500);
      }
      return data;
    }
    await sleep(intervalMs);
  }

  throw new Error("Sync timed out waiting for completion");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
