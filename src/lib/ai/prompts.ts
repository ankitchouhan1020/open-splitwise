import type { ParsedFilterDraft } from "@/lib/ai/schema";
import type { CatalogHints } from "@/lib/ai/catalog-hints";

export type FilterCatalog = {
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
};

export function buildParseFiltersPrompt(input: {
  query: string;
  today: string;
  ownerName?: string;
  hints?: CatalogHints | null;
}): { system: string; user: string } {
  const owner = input.ownerName?.trim() || "the account owner";

  const system = `Parse expense search queries into structured filter JSON. Today is ${input.today} (ISO).

Grammar (omit unused fields):
- q: free-text search
- dateFrom/dateTo: inclusive YYYY-MM-DD; resolve relative dates from today
- groupName, friendName, categoryName: strings as written in the query
- paidByName/paidToName: payer → payee ("Alex paid me" → paidBy Alex, paidTo me). Use "me"/"I" for ${owner}
- friendName: person involved in any role — not for "X paid Y"
- payment: true = settlements only; false = non-settlements; omit for regular "who paid" on expenses
- costMin/costMax: total amount; shareMin/shareMax: user's share
- sort: date|expenseDate|cost|description; order: asc|desc ("biggest first" → cost desc; "recent" → date desc)
- "last year": rolling 365 days unless clearly the previous calendar year`;

  const hintLine =
    input.hints != null ? `\nHints: ${JSON.stringify(input.hints)}` : "";
  const user = `${JSON.stringify(input.query)}${hintLine}`;

  return { system, user };
}

export type NarrativePromptData = {
  today: string;
  currency: string;
  /** Analytical facts not shown on insight cards — synthesize these, don't restate card copy. */
  facts: string[];
  refresh?: boolean;
};

export function buildNarrativePrompt(summary: NarrativePromptData): {
  system: string;
  user: string;
} {
  const regenerateRule = summary.refresh
    ? "\n- This is a regenerate request: lead with a different angle than spending % or top category. Connect or contrast two facts if you can."
    : "";

  const system = `Write 2-3 sentences synthesizing this month's spending for a Splitwise home dashboard. Today is ${summary.today}; currency ${summary.currency}.

The user already sees insight cards (spend trend, top category, largest expense). Your job is NOT to paraphrase those cards.
Use the provided facts — analytical observations they have NOT seen. Connect or contrast two facts when possible (pace vs last month, category shift, recent acceleration, balances).
Use ONLY numbers and names from the facts. Do not lead with the month total. No bullet lists, advice, or platitudes.${regenerateRule}

Return JSON with a single "narrative" field.`;

  const user = JSON.stringify({
    today: summary.today,
    currency: summary.currency,
    facts: summary.facts,
  });
  return { system, user };
}

export type SuggestCategoriesExpenseInput = {
  description: string;
  details?: string | null;
  categoryName?: string | null;
};

export function buildSuggestCategoriesPrompt(input: {
  expenses: SuggestCategoriesExpenseInput[];
  categoryNames: string[];
}): { system: string; user: string } {
  const system = `Suggest Splitwise expense categories from descriptions and notes.

Rules:
- Pick categoryName ONLY from the provided category list — exact spelling from the list
- Return one suggestion per expense index when confident; omit uncertain expenses
- Prefer specific categories over generic ones when the description clearly fits
- If currentCategory is set, suggest a different category only when the description clearly fits another category better

Return JSON: { "suggestions": [{ "expenseIndex": 0, "categoryName": "..." }] }`;

  const user = JSON.stringify({
    categories: input.categoryNames,
    expenses: input.expenses.map((expense, expenseIndex) => ({
      expenseIndex,
      description: expense.description,
      details: expense.details?.trim() || null,
      currentCategory: expense.categoryName?.trim() || null,
    })),
  });

  return { system, user };
}

export type { ParsedFilterDraft };
