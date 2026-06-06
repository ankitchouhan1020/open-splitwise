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
  buildNarrativeFacts,
  hasUsableNarrativeFacts,
  selectNarrativeFacts,
  type NarrativeFact,
} from "@/lib/ai/narrative-facts";
import {
  buildNarrativePrompt,
  type NarrativePromptData,
} from "@/lib/ai/prompts";
import { narrativeAiResponseSchema } from "@/lib/ai/response-schemas";
import type { DashboardSummary } from "@/lib/expenses/dashboard";
import { lastMonthRange } from "@/lib/expenses/dashboard";
import { getCategoryBreakdown } from "@/lib/expenses/insights";

const NARRATIVE_MAX_TOKENS = 200;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function narrativeCacheLookupKey(
  accountUserId: number,
  summary: DashboardSummary,
  model: string,
  refresh: boolean,
  refreshFactsKey?: string,
): string {
  const base = narrativeCacheKey(
    accountUserId,
    monthKey(new Date()),
    narrativeDataFingerprint(summary),
    model,
  );
  if (!refresh) return base;
  return `${base}:refresh:${refreshFactsKey ?? "alt"}`;
}

export async function gatherNarrativeFacts(
  summary: DashboardSummary,
  now = new Date(),
): Promise<NarrativeFact[]> {
  const lastMonthCategories = await getCategoryBreakdown(
    {
      ...lastMonthRange(now),
      currency: summary.currency,
      excludePayments: true,
    },
    5,
  );
  return buildNarrativeFacts(summary, { now, lastMonthCategories });
}

export function buildNarrativePromptData(
  facts: NarrativeFact[],
  options: {
    currency: string;
    now?: Date;
    refresh?: boolean;
  },
): NarrativePromptData {
  const selected = selectNarrativeFacts(facts, options.refresh === true);
  return {
    today: (options.now ?? new Date()).toISOString().slice(0, 10),
    currency: options.currency,
    facts: selected.map((fact) => fact.text),
    refresh: options.refresh === true,
  };
}

/** Cache lookup only — never calls the LLM. */
export async function getCachedDashboardNarrative(
  accountUserId: number,
  summary: DashboardSummary,
): Promise<string | null> {
  const config = await getAiClientConfig(accountUserId);
  const key = narrativeCacheLookupKey(
    accountUserId,
    summary,
    config.model,
    false,
  );
  return getCachedNarrative(key);
}

export async function generateDashboardNarrative(
  accountUserId: number,
  summary: DashboardSummary,
  options: { refresh?: boolean } = {},
): Promise<string> {
  const config = await getAiClientConfig(accountUserId);
  const now = new Date();
  const facts = await gatherNarrativeFacts(summary, now);

  if (!hasUsableNarrativeFacts(facts)) {
    throw new Error("narrative_insufficient_data");
  }

  const refresh = options.refresh === true;
  const selectedFacts = refresh ? selectNarrativeFacts(facts, true) : facts;
  const refreshFactsKey = selectedFacts.map((fact) => fact.id).join(",");
  const key = narrativeCacheLookupKey(
    accountUserId,
    summary,
    config.model,
    refresh,
    refreshFactsKey,
  );

  if (!refresh) {
    const cached = getCachedNarrative(key);
    if (cached) return cached;
  }

  const promptData = buildNarrativePromptData(facts, {
    currency: summary.currency,
    now,
    refresh,
  });
  const { system, user } = buildNarrativePrompt(promptData);

  const result = await completeJson({
    config,
    responseSchema: narrativeAiResponseSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: refresh ? 0.72 : 0.5,
    maxTokens: NARRATIVE_MAX_TOKENS,
  });

  setCachedNarrative(key, result.narrative);
  return result.narrative;
}
