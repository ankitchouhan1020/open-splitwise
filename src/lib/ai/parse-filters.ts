import "server-only";

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

export async function parseNaturalLanguageFilters(
  accountUserId: number,
  query: string,
): Promise<ParseFiltersResult> {
  const config = await getAiClientConfig(accountUserId);
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    throw new Error("not_connected");
  }
  const catalog = await getFilterOptions();

  const today = new Date().toISOString().slice(0, 10);
  const { system, user } = buildParseFiltersPrompt({
    query,
    today,
    catalog,
  });

  const draft = await completeJson({
    config,
    responseSchema: parseFiltersResponseSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return resolveParsedFilters(draft, catalog, {
    ownerSplitwiseId: owner.splitwiseId,
  });
}
