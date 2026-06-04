"use client";

import {
  SettingsAlert,
  SettingsSection,
  SettingsStat,
  StatusBadge,
} from "@/app/settings/settings-ui";
import {
  useSyncStatus,
  type SyncStatus,
} from "@/components/sync-status-provider";
import { formatRelativeSync } from "@/lib/format";
import Link from "next/link";
import { useState } from "react";

type Props = {
  dbConfigured: boolean;
};

function metadataSummary(meta: SyncStatus["metadata"]): string {
  if (!meta) return "—";
  const times = [
    meta.groupsLastSyncAt,
    meta.friendsLastSyncAt,
    meta.categoriesLastSyncAt,
  ].filter(Boolean) as string[];
  if (times.length === 0) return "Never synced";
  const latest = times.reduce((a, b) => (a > b ? a : b));
  return formatRelativeSync(latest);
}

function statusTone(
  status: string,
  inProgress: boolean,
): "ok" | "warn" | "error" | "neutral" {
  if (inProgress || status === "syncing") return "warn";
  if (status === "error") return "error";
  if (status === "idle") return "ok";
  return "neutral";
}

export function SyncPanel({ dbConfigured }: Props) {
  const { status, busy, runSync } = useSyncStatus();
  const [scopeMessage, setScopeMessage] = useState<string | null>(null);

  async function runScopedSync(scope: "all" | "expenses" | "metadata") {
    setScopeMessage(null);
    const result = await runSync(scope);
    if (!result.ok) {
      setScopeMessage(result.error);
      return;
    }
    if (scope === "metadata" && result.metadata) {
      const m = result.metadata;
      setScopeMessage(
        `Updated ${m.groups} groups, ${m.friends} friends, ${m.categories} categories.`,
      );
    } else if (result.expenses) {
      setScopeMessage(
        `Synced ${result.expenses.synced} expenses (${result.expenses.total} total stored).`,
      );
    } else {
      setScopeMessage("Sync complete.");
    }
  }

  if (!dbConfigured) {
    return (
      <SettingsSection
        title="Data sync"
        description="Local Postgres cache for search and analytics."
        action={<StatusBadge tone="error">No database</StatusBadge>}
      >
        <SettingsAlert tone="info">
          Set <code>DATABASE_URL</code> in <code>.env.local</code>, then run{" "}
          <code>pnpm db:migrate</code>. Restart the dev server after changing
          env vars.
        </SettingsAlert>
      </SettingsSection>
    );
  }

  const exp = status?.expenses;
  const expenseStatus = busy ? "syncing" : (exp?.status ?? "idle");

  return (
    <SettingsSection
      title="Data sync"
      description="Expenses and metadata cached locally. Use Sync in the header for a full refresh."
      action={
        exp ? (
          <StatusBadge tone={statusTone(expenseStatus, busy)}>
            {busy ? "Syncing" : exp.status}
          </StatusBadge>
        ) : null
      }
    >
      <div className="space-y-4">
        {exp && (
          <div className="grid gap-2 sm:grid-cols-3">
            <SettingsStat
              label="Expenses stored"
              value={exp.expenseCount.toLocaleString()}
              sub={
                exp.expenseCount > 0 ? (
                  <Link href="/explore" className="text-accent hover:underline">
                    Browse in Explore →
                  </Link>
                ) : (
                  "Run sync to import"
                )
              }
            />
            <SettingsStat
              label="Last expense sync"
              value={formatRelativeSync(exp.lastSyncAt)}
              sub={
                exp.lastSyncAt
                  ? new Date(exp.lastSyncAt).toLocaleString()
                  : undefined
              }
            />
            <SettingsStat
              label="Groups & friends"
              value={metadataSummary(status?.metadata)}
              sub="Categories included"
            />
          </div>
        )}

        {exp?.error && <SettingsAlert tone="error">{exp.error}</SettingsAlert>}

        {scopeMessage && (
          <SettingsAlert tone="success">{scopeMessage}</SettingsAlert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted text-xs font-medium">Sync scope:</span>
          <button
            type="button"
            onClick={() => void runScopedSync("all")}
            disabled={busy}
            className={btnSecondary}
          >
            {busy ? "Syncing…" : "All"}
          </button>
          <button
            type="button"
            onClick={() => void runScopedSync("expenses")}
            disabled={busy}
            className={btnSecondary}
          >
            Expenses only
          </button>
          <button
            type="button"
            onClick={() => void runScopedSync("metadata")}
            disabled={busy}
            className={btnSecondary}
          >
            Metadata only
          </button>
        </div>

        <p className="text-muted text-xs leading-relaxed">
          Incremental sync fetches only expenses changed since the last run.
          Metadata sync refreshes groups, friends, and categories. Status
          refreshes automatically while a sync is running.
        </p>
      </div>
    </SettingsSection>
  );
}

const btnSecondary =
  "border-border text-foreground rounded-lg border bg-white px-2.5 py-1 text-xs font-medium hover:bg-stone-50 disabled:opacity-50";
