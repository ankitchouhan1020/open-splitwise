import "server-only";

import { matchCategoryByName } from "@/lib/ai/match-catalog";
import { completeJson } from "@/lib/ai/client";
import { getAiClientConfig } from "@/lib/ai/availability";
import { buildSuggestCategoriesPrompt } from "@/lib/ai/prompts";
import { suggestCategoriesAiResponseSchema } from "@/lib/ai/response-schemas";
import { getFilterOptions } from "@/lib/expenses/queries";

export type SuggestCategoriesExpense = {
  id: number;
  description: string;
  details?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
};

export type CategorySuggestion = {
  expenseId: number;
  categoryId: number;
  categoryName: string;
};

export type SuggestCategoriesResult = {
  suggestions: CategorySuggestion[];
};

const SUGGEST_CATEGORIES_MAX_TOKENS = 1024;

export async function suggestExpenseCategories(
  accountUserId: number,
  expenses: SuggestCategoriesExpense[],
): Promise<SuggestCategoriesResult> {
  const config = await getAiClientConfig(accountUserId);
  const options = await getFilterOptions();
  const categories = options.categories;

  const { system, user } = buildSuggestCategoriesPrompt({
    expenses,
    categoryNames: categories.map((c) => c.name),
  });

  const draft = await completeJson({
    config,
    responseSchema: suggestCategoriesAiResponseSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens: SUGGEST_CATEGORIES_MAX_TOKENS,
  });

  const suggestions: CategorySuggestion[] = [];

  for (const item of draft.suggestions) {
    const expense = expenses[item.expenseIndex];
    if (!expense) continue;

    const match = matchCategoryByName(item.categoryName, categories);
    if (match.status !== "matched") continue;

    const currentCategoryId = expense.categoryId ?? null;
    if (currentCategoryId === match.id) continue;

    suggestions.push({
      expenseId: expense.id,
      categoryId: match.id,
      categoryName: match.name,
    });
  }

  return { suggestions };
}
