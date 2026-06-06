import "server-only";

import type { DashboardSummary } from "@/lib/expenses/dashboard";

const narrativeCache = new Map<
  string,
  { narrative: string; expiresAt: number }
>();

const CACHE_TTL_MS = 30 * 60_000;

export function getCachedNarrative(key: string): string | null {
  const entry = narrativeCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    narrativeCache.delete(key);
    return null;
  }
  return entry.narrative;
}

export function setCachedNarrative(key: string, narrative: string): void {
  narrativeCache.set(key, {
    narrative,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/** Stable fingerprint so cache invalidates when synced spending data changes. */
export function narrativeDataFingerprint(summary: DashboardSummary): string {
  const topCategory = summary.topCategories[0];
  const topGroup = summary.topGroups[0];
  return [
    summary.sync.lastSyncAt ?? "none",
    summary.thisMonth.total,
    summary.thisMonth.expenseCount,
    summary.lastMonth.total,
    summary.deltaPct ?? "na",
    topCategory?.categoryId ?? "none",
    topCategory?.total ?? "0",
    topGroup?.groupId ?? "none",
    topGroup?.myShareTotal ?? "0",
  ].join("|");
}

export function narrativeCacheKey(
  accountUserId: number,
  monthKey: string,
  dataFingerprint: string,
  model: string,
): string {
  return `${accountUserId}:${monthKey}:${dataFingerprint}:${model}`;
}

/** Test helper — clears in-memory narrative cache. */
export function clearNarrativeCacheForTests(): void {
  narrativeCache.clear();
}
