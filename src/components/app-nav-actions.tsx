"use client";

import { AddExpenseButton } from "@/components/add-expense-drawer";
import { useDemoMode } from "@/components/demo-mode-provider";
import { NavIconAdd, NavIconSync } from "@/components/nav-icons";
import { useSyncStatus } from "@/components/sync-status-provider";
import { DEMO_MODE_COPY } from "@/lib/demo/copy";
import Link from "next/link";

type Props = {
  connected: boolean;
  oauthConnected: boolean;
  dbConfigured: boolean;
  fakeDataOn?: boolean;
};

const iconBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50";
const btnPrimary =
  "bg-accent inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50";
const btnSecondary =
  "border-border text-foreground inline-flex shrink-0 items-center justify-center rounded-lg border bg-card font-medium hover:bg-hover disabled:opacity-50";

export function AppNavActions({
  connected,
  oauthConnected,
  dbConfigured,
  fakeDataOn = false,
}: Props) {
  const demoMode = useDemoMode() || fakeDataOn;
  const canSync = oauthConnected && dbConfigured;
  const { status, busy, runSync } = useSyncStatus();

  if (!connected) {
    return (
      <Link
        href="/api/auth/splitwise"
        className={`${btnPrimary} px-3 py-1.5 text-sm`}
      >
        Connect
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {canSync && (
        <button
          type="button"
          onClick={() => void runSync("all")}
          disabled={busy || demoMode}
          aria-label={busy ? "Sync in progress" : "Sync from Splitwise"}
          title={
            demoMode
              ? DEMO_MODE_COPY.sync
              : busy
                ? "Syncing…"
                : status?.expenses?.lastSyncAt
                  ? `Last sync: ${new Date(status.expenses.lastSyncAt).toLocaleString()}`
                  : "Sync from Splitwise"
          }
          className={
            status?.expenses?.status === "error"
              ? `${btnSecondary} ${iconBtn} text-error-text hover:bg-error-bg border-red-300`
              : `${btnSecondary} ${iconBtn}`
          }
        >
          <NavIconSync
            className={`h-[17px] w-[17px] ${busy ? "animate-spin" : ""}`}
          />
        </button>
      )}

      {oauthConnected && (
        <AddExpenseButton
          disabled={demoMode}
          title={demoMode ? DEMO_MODE_COPY.addExpense : undefined}
          className={`${btnPrimary} hidden gap-1.5 px-3 py-1.5 text-sm md:inline-flex`}
        >
          <NavIconAdd className="h-4 w-4" />
          Add expense
        </AddExpenseButton>
      )}
    </div>
  );
}
