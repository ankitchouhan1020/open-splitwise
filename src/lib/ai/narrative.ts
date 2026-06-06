import "server-only";

import {
  getCachedNarrative,
  narrativeCacheKey,
  setCachedNarrative,
} from "@/lib/ai/cache";
import { completeJson } from "@/lib/ai/client";
import { getAiClientConfig } from "@/lib/ai/availability";
import { buildNarrativePrompt } from "@/lib/ai/prompts";
import { narrativeAiResponseSchema } from "@/lib/ai/response-schemas";
import type { DashboardSummary } from "@/lib/expenses/dashboard";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function generateDashboardNarrative(
  accountUserId: number,
  summary: DashboardSummary,
): Promise<string> {
  const config = await getAiClientConfig(accountUserId);
  const key = narrativeCacheKey(
    accountUserId,
    monthKey(new Date()),
    summary.sync.lastSyncAt,
    config.model,
  );
  const cached = getCachedNarrative(key);
  if (cached) return cached;

  const promptData = {
    currency: summary.currency,
    thisMonthTotal: summary.thisMonth.total,
    thisMonthCount: summary.thisMonth.expenseCount,
    lastMonthTotal: summary.lastMonth.total,
    deltaPct: summary.deltaPct,
    topCategories: summary.topCategories.slice(0, 3).map((c) => ({
      name: c.categoryName,
      total: c.total,
      count: c.count,
    })),
    topGroup: summary.topGroups[0]
      ? {
          name: summary.topGroups[0].groupName,
          count: summary.topGroups[0].expenseCount,
          share: summary.topGroups[0].myShareTotal,
        }
      : null,
    projectedMonthTotal: summary.projectedMonthTotal,
    balanceNet: summary.balances?.net ?? null,
  };

  const { system, user } = buildNarrativePrompt(promptData);

  const result = await completeJson({
    config,
    responseSchema: narrativeAiResponseSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  setCachedNarrative(key, result.narrative);
  return result.narrative;
}
