import "server-only";

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

export function narrativeCacheKey(
  accountUserId: number,
  monthKey: string,
  syncAt: string | null,
  model: string,
): string {
  return `${accountUserId}:${monthKey}:${syncAt ?? "none"}:${model}`;
}

/** Test helper — clears in-memory narrative cache. */
export function clearNarrativeCacheForTests(): void {
  narrativeCache.clear();
}
