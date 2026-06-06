import "server-only";

import {
  getCachedNarrative,
  narrativeCacheKey,
  narrativeDataFingerprint,
  setCachedNarrative,
} from "@/lib/ai/cache";
import { completeJson } from "@/lib/ai/client";
import { getAiClientConfig } from "@/lib/ai/availability";
import {
  buildNarrativePrompt,
  type NarrativePromptData,
} from "@/lib/ai/prompts";
import { narrativeAiResponseSchema } from "@/lib/ai/response-schemas";
import type { DashboardSummary } from "@/lib/expenses/dashboard";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildNarrativePromptData(
  summary: DashboardSummary,
  now = new Date(),
): NarrativePromptData {
  const day = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  return {
    today: now.toISOString().slice(0, 10),
    currency: summary.currency,
    thisMonth: {
      total: summary.thisMonth.total,
      count: summary.thisMonth.expenseCount,
      daysElapsed: day,
      daysInMonth,
    },
    lastMonth: {
      total: summary.lastMonth.total,
      count: summary.lastMonth.expenseCount,
    },
    change: {
      amount: summary.delta,
      percent: summary.deltaPct,
    },
    projectedMonthTotal: summary.projectedMonthTotal,
    topCategories: summary.topCategories.slice(0, 5).map((c) => ({
      name: c.categoryName,
      total: c.total,
      count: c.count,
    })),
    topGroups: summary.topGroups.slice(0, 3).map((g) => ({
      name: g.groupName,
      count: g.expenseCount,
      share: g.myShareTotal,
      percentOfTotal: g.percentOfTotal,
    })),
    monthlyTrend: summary.monthlySparkline.slice(-6).map((m) => ({
      month: m.month,
      total: m.total,
      count: m.count,
    })),
    balances: summary.balances
      ? {
          youAreOwed: summary.balances.youAreOwed,
          youOwe: summary.balances.youOwe,
          net: summary.balances.net,
          topOwedToYou: summary.balances.topOwedToYou.slice(0, 2),
          topYouOwe: summary.balances.topYouOwe.slice(0, 2),
        }
      : null,
    recentHighlights: summary.recentExpenses.slice(0, 4).map((e) => ({
      description: e.description,
      amount: e.myShare ?? e.cost,
      date: e.date.slice(0, 10),
      group: e.groupName,
      category: e.categoryName,
    })),
    signals: summary.insights.map((i) => ({
      headline: i.headline,
      detail: i.detail,
    })),
  };
}

export async function generateDashboardNarrative(
  accountUserId: number,
  summary: DashboardSummary,
  options: { refresh?: boolean } = {},
): Promise<string> {
  const config = await getAiClientConfig(accountUserId);
  const fingerprint = narrativeDataFingerprint(summary);
  const key = narrativeCacheKey(
    accountUserId,
    monthKey(new Date()),
    fingerprint,
    config.model,
  );

  if (!options.refresh) {
    const cached = getCachedNarrative(key);
    if (cached) return cached;
  }

  const promptData = buildNarrativePromptData(summary);
  const { system, user } = buildNarrativePrompt(promptData);

  const result = await completeJson({
    config,
    responseSchema: narrativeAiResponseSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: options.refresh ? 0.65 : 0.45,
  });

  setCachedNarrative(key, result.narrative);
  return result.narrative;
}
