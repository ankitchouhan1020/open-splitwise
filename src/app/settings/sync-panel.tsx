"use client";

import { useCallback, useEffect, useState } from "react";

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

export function SyncPanel({ dbConfigured }: { dbConfigured: boolean }) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/sync/status");
    if (res.ok) setStatus((await res.json()) as SyncStatus);
  }, []);

  useEffect(() => {
    if (!dbConfigured) return;
    void refresh();
    const id = setInterval(() => void refresh(), 3000);
    return () => clearInterval(id);
  }, [dbConfigured, refresh]);

  async function runSync() {
    if (syncing) return;
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const data = (await res.json()) as {
        error?: string;
        expenses?: { synced: number; total: number };
      };
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed");
      } else if (data.expenses) {
        setMessage(
          `Synced ${data.expenses.synced} expenses (${data.expenses.total} total in database).`,
        );
      } else {
        setMessage("Sync complete.");
      }
      await refresh();
    } catch {
      setMessage("Sync request failed");
    } finally {
      setSyncing(false);
    }
  }

  if (!dbConfigured) {
    return (
      <div className="border-border bg-card mt-8 rounded-xl border p-6">
        <h2 className="text-lg font-medium">Data sync</h2>
        <p className="text-muted mt-2 text-sm">
          Set <code>DATABASE_URL</code> in <code>.env.local</code> and run{" "}
          <code>pnpm db:migrate</code>.
        </p>
      </div>
    );
  }

  const exp = status?.expenses;

  return (
    <div className="border-border bg-card mt-8 space-y-4 rounded-xl border p-6">
      <h2 className="text-lg font-medium">Data sync</h2>
      <p className="text-muted text-sm">
        Download expenses from Splitwise into your local database for search and
        analytics.
      </p>

      {exp && (
        <dl className="text-muted grid grid-cols-2 gap-2 text-sm">
          <dt>Status</dt>
          <dd className="text-foreground font-medium">
            {status?.inProgress ? "syncing" : exp.status}
          </dd>
          <dt>Expenses stored</dt>
          <dd className="text-foreground font-medium">{exp.expenseCount}</dd>
          <dt>Last sync</dt>
          <dd className="text-foreground font-medium">
            {exp.lastSyncAt
              ? new Date(exp.lastSyncAt).toLocaleString()
              : "Never"}
          </dd>
        </dl>
      )}

      {exp?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {exp.error}
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => void runSync()}
        disabled={syncing || status?.inProgress}
        className="bg-accent rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {syncing || status?.inProgress ? "Syncing…" : "Sync now"}
      </button>
    </div>
  );
}
