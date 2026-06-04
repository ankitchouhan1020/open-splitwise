"use client";

import { AddExpenseButton } from "@/components/add-expense-dialog";
import { useSyncStatus } from "@/components/sync-status-provider";
import Link from "next/link";

type Props = {
  connected: boolean;
  dbConfigured: boolean;
};

const btnPrimary =
  "bg-accent shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const btnSecondary =
  "border-border text-foreground shrink-0 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50";

export function AppNavActions({ connected, dbConfigured }: Props) {
  const syncEnabled = connected && dbConfigured;
  const { status, busy, runSync } = useSyncStatus();

  if (!connected) {
    return (
      <Link href="/api/auth/splitwise" className={btnPrimary}>
        Connect
      </Link>
    );
  }

  const syncFailed = status?.expenses?.status === "error";

  return (
    <div className="flex shrink-0 items-center gap-2">
      {syncEnabled && (
        <button
          type="button"
          onClick={() => void runSync("all")}
          disabled={busy}
          className={
            syncFailed
              ? `${btnSecondary} border-red-300 text-red-800 hover:bg-red-50`
              : btnSecondary
          }
          title={
            status?.expenses?.lastSyncAt
              ? `Last sync: ${new Date(status.expenses.lastSyncAt).toLocaleString()}`
              : "Sync expenses from Splitwise"
          }
        >
          {busy ? "Syncing…" : "Sync"}
        </button>
      )}
      <AddExpenseButton className={btnPrimary}>+ Add expense</AddExpenseButton>
    </div>
  );
}
