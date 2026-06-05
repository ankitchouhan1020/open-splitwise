"use client";

import { AddExpenseButton } from "@/components/add-expense-dialog";
import { FakeDataToggle } from "@/components/fake-data-toggle";
import {
  NavIconAdd,
  NavIconSettings,
  NavIconSync,
} from "@/components/nav-icons";
import { SyncProgressIndicator } from "@/components/sync-progress-indicator";
import { useSyncStatus } from "@/components/sync-status-provider";
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
  const syncEnabled = oauthConnected && dbConfigured && !fakeDataOn;
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
      {oauthConnected && <FakeDataToggle enabled={fakeDataOn} compact />}

      {syncEnabled && (
        <button
          type="button"
          onClick={() => void runSync("all")}
          disabled={busy}
          aria-label={busy ? "Sync in progress" : "Sync from Splitwise"}
          title={
            busy
              ? undefined
              : status?.expenses?.lastSyncAt
                ? `Last sync: ${new Date(status.expenses.lastSyncAt).toLocaleString()}`
                : "Sync from Splitwise"
          }
          className={
            status?.expenses?.status === "error"
              ? `${btnSecondary} ${iconBtn} text-error-text hover:bg-error-bg border-red-300 md:h-auto md:w-auto md:px-3 md:py-1.5 md:text-sm`
              : `${btnSecondary} ${iconBtn} md:h-auto md:w-auto md:px-3 md:py-1.5 md:text-sm`
          }
        >
          {busy ? (
            <>
              <span className="hidden md:inline">
                <SyncProgressIndicator progress={status?.progress} compact />
              </span>
              <NavIconSync className="h-[17px] w-[17px] animate-spin md:hidden" />
            </>
          ) : (
            <>
              <NavIconSync className="h-[17px] w-[17px] md:hidden" />
              <span className="hidden md:inline">Sync</span>
            </>
          )}
        </button>
      )}

      {oauthConnected && !fakeDataOn && (
        <AddExpenseButton
          className={`${btnPrimary} hidden gap-1.5 px-3 py-1.5 text-sm md:inline-flex`}
        >
          <NavIconAdd className="h-4 w-4" />
          Add expense
        </AddExpenseButton>
      )}

      <Link
        href="/settings"
        aria-label="Settings"
        className={`${btnSecondary} ${iconBtn} md:hidden`}
      >
        <NavIconSettings className="h-[17px] w-[17px]" />
      </Link>
    </div>
  );
}
