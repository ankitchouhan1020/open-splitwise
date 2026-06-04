"use client";

import { useCallback, useEffect, useState } from "react";

const STALE_MS = 86400000;

type SyncStatus = {
  configured: boolean;
  connected?: boolean;
  inProgress?: boolean;
  expenses?: {
    status: string;
    lastSyncAt: string | null;
    expenseCount: number;
    error: string | null;
  };
};

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

export function SyncStatusBanner() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/sync/status");
    if (res.ok) setStatus((await res.json()) as SyncStatus);
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 3000);
    return () => clearInterval(id);
  }, [refresh]);

  async function runSync() {
    if (syncing || status?.inProgress) return;
    setSyncing(true);
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      await refresh();
    } finally {
      setSyncing(false);
    }
  }

  if (!shouldShowBanner(status)) return null;

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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-2.5 text-sm">
        <div className={hasError ? "text-red-900" : "text-amber-950"}>
          <p className="font-medium">
            {hasError
              ? "Expense sync failed"
              : "Your expense data may be out of date"}
          </p>
          <p className="mt-0.5 opacity-90">
            Last sync: {lastSyncLabel} · {exp.expenseCount} expenses stored
            {exp.error ? ` · ${exp.error}` : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runSync()}
          disabled={syncing || status?.inProgress}
          className="bg-accent shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {syncing || status?.inProgress ? "Syncing…" : "Sync now"}
        </button>
      </div>
    </div>
  );
}
