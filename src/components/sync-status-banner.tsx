"use client";

import {
  useSyncStatus,
  type SyncStatus,
} from "@/components/sync-status-provider";
import { friendlySyncError } from "@/lib/api-errors";

function shouldShowBanner(status: SyncStatus | null): boolean {
  if (!status?.configured || !status.connected) return false;
  const exp = status.expenses;
  if (!exp) return false;
  return exp.status === "error";
}

type Props = {
  connected: boolean;
  dbConfigured: boolean;
};

export function SyncStatusBanner({ connected, dbConfigured }: Props) {
  const enabled = connected && dbConfigured;
  const { status } = useSyncStatus();

  if (!enabled || !shouldShowBanner(status)) return null;

  const exp = status!.expenses!;
  const syncErrorDetail = friendlySyncError(exp.error);
  const lastSyncLabel = exp.lastSyncAt
    ? new Date(exp.lastSyncAt).toLocaleString()
    : "Never";

  return (
    <div role="status" className="border-error-border bg-error-bg border-b">
      <div className="mx-auto max-w-6xl px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <p className="text-error-text font-medium">Expense sync failed</p>
        <p className="text-error-text mt-0.5 opacity-90">
          <span className="hidden sm:inline">
            Last sync: {lastSyncLabel} · {exp.expenseCount} expenses stored
            {syncErrorDetail ? ` · ${syncErrorDetail}` : null}
            {" · "}
            Use <span className="font-medium">Sync</span> in the header to
            refresh.
          </span>
          <span className="sm:hidden">
            Tap sync in the header to refresh · {exp.expenseCount} stored
            {syncErrorDetail ? ` · ${syncErrorDetail}` : null}
          </span>
        </p>
      </div>
    </div>
  );
}
