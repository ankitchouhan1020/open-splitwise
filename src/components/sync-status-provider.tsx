"use client";

import { useSyncStatusQuery } from "@/lib/query/hooks";
import { fetchJson, FetchJsonError } from "@/lib/query/fetch-json";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
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
  | {
      ok: true;
      expenses?: { synced: number; total: number };
      metadata?: { groups: number; friends: number; categories: number };
    }
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
        const data = await fetchJson<{
          expenses?: { synced: number; total: number };
          metadata?: { groups: number; friends: number; categories: number };
        }>("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope }),
        });
        await refetch();
        await invalidateExpenseCaches(queryClient);
        return {
          ok: true,
          expenses: data.expenses,
          metadata: data.metadata,
        };
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
