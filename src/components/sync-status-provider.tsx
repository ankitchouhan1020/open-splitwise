"use client";

import { useSyncStatusQuery } from "@/lib/query/hooks";
import { fetchJson, FetchJsonError } from "@/lib/query/fetch-json";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { waitForSyncComplete } from "@/lib/query/wait-for-sync";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SyncStatus = {
  configured: boolean;
  connected?: boolean;
  inProgress?: boolean;
  progress?: {
    phase: "metadata" | "expenses";
    synced: number;
    label: string | null;
  } | null;
  expenses?: {
    status: string;
    lastSyncAt: string | null;
    expenseCount: number;
    error: string | null;
  };
  metadata?: {
    groupsLastSyncAt: string | null;
    friendsLastSyncAt: string | null;
    categoriesLastSyncAt: string | null;
  };
};

type SyncStatusContextValue = {
  status: SyncStatus | null;
  busy: boolean;
  syncing: boolean;
  refresh: () => Promise<void>;
  runSync: (scope?: "all" | "expenses" | "metadata") => Promise<SyncRunResult>;
};

export type SyncRunResult =
  | { ok: true; status: SyncStatus }
  | { ok: false; error: string };

const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

export function SyncStatusProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data: status, refetch } = useSyncStatusQuery(enabled, syncing);

  const resolvedStatus = enabled ? (status ?? null) : null;
  const inProgress = Boolean(syncing || resolvedStatus?.inProgress);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await refetch();
  }, [enabled, refetch]);

  const runSync = useCallback(
    async (
      scope: "all" | "expenses" | "metadata" = "all",
    ): Promise<SyncRunResult> => {
      if (syncing || resolvedStatus?.inProgress) {
        return { ok: false, error: "Sync already in progress" };
      }
      setSyncing(true);
      try {
        await fetchJson<{ ok: true; started: true; scope: string }>(
          "/api/sync",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scope }),
          },
        );
        const finalStatus = await waitForSyncComplete(async () => {
          const result = await refetch();
          return { data: result.data };
        });
        await invalidateExpenseCaches(queryClient);
        return { ok: true, status: finalStatus };
      } catch (err) {
        await refetch();
        const message =
          err instanceof FetchJsonError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Sync request failed";
        return { ok: false, error: message };
      } finally {
        setSyncing(false);
      }
    },
    [syncing, resolvedStatus?.inProgress, refetch, queryClient],
  );

  const value = useMemo(
    () => ({
      status: resolvedStatus,
      busy: inProgress,
      syncing,
      refresh,
      runSync,
    }),
    [resolvedStatus, inProgress, syncing, refresh, runSync],
  );

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus() {
  const ctx = useContext(SyncStatusContext);
  if (!ctx) {
    throw new Error("useSyncStatus must be used within SyncStatusProvider");
  }
  return ctx;
}

/** Safe outside provider — returns null when sync status is unavailable. */
export function useSyncStatusOptional() {
  return useContext(SyncStatusContext);
}
