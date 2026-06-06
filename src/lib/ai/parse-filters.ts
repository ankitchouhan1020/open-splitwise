import "server-only";

import { buildCatalogHints } from "@/lib/ai/catalog-hints";
import { completeJson } from "@/lib/ai/client";
import { getAiClientConfig } from "@/lib/ai/availability";
import { buildParseFiltersPrompt } from "@/lib/ai/prompts";
import { resolveParsedFilters } from "@/lib/ai/resolve-filters";
import { parseFiltersResponseSchema } from "@/lib/ai/response-schemas";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import { getFilterOptions } from "@/lib/expenses/queries";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";

export type ParseFiltersResult = {
  filters: ExpenseFilters;
  explanation: string;
  warnings: string[];
};

const PARSE_FILTERS_MAX_TOKENS = 256;

export async function parseNaturalLanguageFilters(
  accountUserId: number,
  query: string,
): Promise<ParseFiltersResult> {
  const config = await getAiClientConfig(accountUserId);
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    throw new Error("not_connected");
  }
  const options = await getFilterOptions();

  const today = new Date().toISOString().slice(0, 10);
  const hints = buildCatalogHints(query, options);
  const { system, user } = buildParseFiltersPrompt({
    query,
    today,
    ownerName: options.ownerName,
    hints,
  });

  const draft = await completeJson({
    config,
    responseSchema: parseFiltersResponseSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens: PARSE_FILTERS_MAX_TOKENS,
  });

  return resolveParsedFilters(draft, options, {
    ownerSplitwiseId: owner.splitwiseId,
    ownerName: options.ownerName,
  });
}
