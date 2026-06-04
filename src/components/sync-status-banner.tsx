"use client";

import {
  useSyncStatus,
  type SyncStatus,
} from "@/components/sync-status-provider";

const STALE_MS = 86400000;

function isStale(lastSyncAt: string | null): boolean {
  if (!lastSyncAt) return true;
  return Date.now() - new Date(lastSyncAt).getTime() > STALE_MS;
}

function shouldShowBanner(status: SyncStatus | null): boolean {
  if (!status?.configured || !status.connected) return false;
  const exp = status.expenses;
  if (!exp) return false;
  return exp.status === "error" || isStale(exp.lastSyncAt);
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
  const hasError = exp.status === "error";
  const lastSyncLabel = exp.lastSyncAt
    ? new Date(exp.lastSyncAt).toLocaleString()
    : "Never";

  return (
    <div
      role="status"
      className={
        hasError
          ? "border-b border-red-200 bg-red-50"
          : "border-b border-amber-200 bg-amber-50"
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
        <p
          className={
            hasError ? "font-medium text-red-900" : "font-medium text-amber-950"
          }
        >
          {hasError
            ? "Expense sync failed"
            : "Your expense data may be out of date"}
        </p>
        <p
          className={`mt-0.5 opacity-90 ${hasError ? "text-red-900" : "text-amber-950"}`}
        >
          Last sync: {lastSyncLabel} · {exp.expenseCount} expenses stored
          {exp.error ? ` · ${exp.error}` : null}
          {" · "}
          Use <span className="font-medium">Sync</span> in the header to
          refresh.
        </p>
      </div>
    </div>
  );
}
