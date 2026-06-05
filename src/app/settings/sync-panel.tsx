"use client";

import {
  SettingsAlert,
  SettingsBlock,
  SettingsRow,
  SettingsSection,
  SettingsStat,
  StatusBadge,
} from "@/app/settings/settings-ui";
import {
  useSyncStatus,
  type SyncStatus,
} from "@/components/sync-status-provider";
import { SyncProgressIndicator } from "@/components/sync-progress-indicator";
import { formatRelativeSync } from "@/lib/format";
import Link from "next/link";
import { useState } from "react";

type Props = {
  dbConfigured: boolean;
  bare?: boolean;
};

function metadataSummary(meta: SyncStatus["metadata"]): string {
  if (!meta) return "Not yet synced";
  const times = [
    meta.groupsLastSyncAt,
    meta.friendsLastSyncAt,
    meta.categoriesLastSyncAt,
  ].filter(Boolean) as string[];
  if (times.length === 0) return "Not yet synced";
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

export function SyncPanel({ dbConfigured, bare = false }: Props) {
  const { status, busy, runSync } = useSyncStatus();
  const [scopeMessage, setScopeMessage] = useState<string | null>(null);

  async function runScopedSync(scope: "all" | "expenses" | "metadata") {
    setScopeMessage(null);
    const result = await runSync(scope);
    if (!result.ok) {
      setScopeMessage(result.error);
      return;
    }
    const exp = result.status.expenses;
    if (scope === "metadata") {
      setScopeMessage("Groups, friends, and categories are up to date.");
    } else if (exp) {
      setScopeMessage(
        `You're all set — ${exp.expenseCount.toLocaleString()} expenses on this server.`,
      );
    } else {
      setScopeMessage("Sync finished.");
    }
  }

  if (!dbConfigured) {
    const noDb = (
      <SettingsAlert tone="info">
        Sync needs a database on this server. If you&apos;re the host, set{" "}
        <code>DATABASE_URL</code> and run migrations — see the Server tab.
      </SettingsAlert>
    );
    if (bare) return noDb;
    return (
      <SettingsSection
        title="Sync"
        action={<StatusBadge tone="error">Unavailable</StatusBadge>}
      >
        {noDb}
      </SettingsSection>
    );
  }

  const exp = status?.expenses;
  const expenseStatus = busy ? "syncing" : (exp?.status ?? "idle");

  const content = (
    <div className="space-y-4">
      {scopeMessage && (
        <SettingsAlert tone="success">{scopeMessage}</SettingsAlert>
      )}
      {exp?.error && <SettingsAlert tone="error">{exp.error}</SettingsAlert>}

      {exp && (
        <div className="grid gap-3 sm:grid-cols-3">
          <SettingsStat
            label="Expenses on this server"
            value={exp.expenseCount.toLocaleString()}
            sub={
              exp.expenseCount > 0 ? (
                <Link href="/explore" className="text-accent hover:underline">
                  Open Explore
                </Link>
              ) : (
                "Run a sync to import"
              )
            }
          />
          <SettingsStat
            label="Last sync"
            value={formatRelativeSync(exp.lastSyncAt)}
            sub={
              exp.lastSyncAt
                ? new Date(exp.lastSyncAt).toLocaleString()
                : "Never"
            }
          />
          <SettingsStat
            label="Groups & friends"
            value={metadataSummary(status?.metadata)}
            sub="Names and categories for filters"
          />
        </div>
      )}

      <SettingsBlock
        title="Sync from Splitwise"
        description="Pull the latest data into your local cache."
      >
        {busy && (
          <div className="border-border border-b px-4 py-3 md:px-5">
            <SyncProgressIndicator progress={status?.progress} />
          </div>
        )}
        <SettingsRow
          label="Sync now"
          description="Recommended — updates expenses, groups, friends, and categories."
        >
          <button
            type="button"
            onClick={() => void runScopedSync("all")}
            disabled={busy}
            className={btnPrimary}
          >
            {busy ? "Syncing…" : "Sync now"}
          </button>
        </SettingsRow>
        <SettingsRow
          label="Expenses only"
          description="When you only need new or changed expense rows."
        >
          <button
            type="button"
            onClick={() => void runScopedSync("expenses")}
            disabled={busy}
            className={btnSecondary}
          >
            Sync expenses
          </button>
        </SettingsRow>
        <SettingsRow
          label="Groups & friends only"
          description="Refresh names and categories without re-importing every expense."
        >
          <button
            type="button"
            onClick={() => void runScopedSync("metadata")}
            disabled={busy}
            className={btnSecondary}
          >
            Sync names
          </button>
        </SettingsRow>
      </SettingsBlock>
    </div>
  );

  if (bare) return content;

  return (
    <SettingsSection
      title="Sync"
      action={
        exp ? (
          <StatusBadge tone={statusTone(expenseStatus, busy)}>
            {busy
              ? "Syncing"
              : exp.status === "idle"
                ? "Up to date"
                : exp.status}
          </StatusBadge>
        ) : null
      }
    >
      {content}
    </SettingsSection>
  );
}

const btnPrimary =
  "bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50";
const btnSecondary =
  "border-border text-foreground rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-hover disabled:opacity-50";
