import type { ParsedFilterDraft } from "@/lib/ai/schema";

export type FilterCatalog = {
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
};

export function buildParseFiltersPrompt(input: {
  query: string;
  today: string;
  catalog: FilterCatalog;
}): { system: string; user: string } {
  const catalogJson = JSON.stringify(
    {
      groups: input.catalog.groups,
      friends: input.catalog.friends,
      categories: input.catalog.categories,
      currencies: input.catalog.currencies,
    },
    null,
    2,
  );

  const system = `You translate natural-language expense search requests into structured filters for a Splitwise expense explorer.

Today's date is ${input.today} (ISO). Use it to resolve relative dates like "last month", "this quarter", "last 30 days".

Return JSON matching the provided response schema. Rules:
- Prefer exact catalog names for group/friend/category; do not invent IDs.
- dateFrom/dateTo are inclusive calendar dates (YYYY-MM-DD).
- Use null for filter fields that do not apply.
- costMin/costMax filter total expense amount; shareMin/shareMax filter the user's share.
- sort: "date" | "cost" | "description"; order: "asc" | "desc".
  Examples: "biggest first" → sort cost, order desc; "oldest first" → sort date, order asc.
- explanation: short, user-facing phrase for what they'll see (e.g. "Paid to Alex · last year").
  Never say "filters", "filtering", or describe system mechanics.
- friendName: expenses involving that person in any role. Do NOT use for "X paid Y".
- paidByName / paidToName: who paid whom (primary payer → primary payee). Use "me" for the account owner.
- "I paid Alex" → paidByName "me", paidToName "Alex", payment true.
- "Alex paid me" → paidByName "Alex", paidToName "me", payment true.
- "Alex paid Jordan" → paidByName "Alex", paidToName "Jordan", payment true.
- Do not set friendName when paidByName/paidToName capture the relationship.
- "how much", "total", "sum": pick the best filters; totals appear above the expense list.
- "last year": rolling 365 days ending today unless the user clearly means the previous calendar year.`;

  const user = `Catalog (groups, friends, categories, currencies):
${catalogJson}

User query: ${JSON.stringify(input.query)}`;

  return { system, user };
}

export function buildNarrativePrompt(summary: {
  currency: string;
  thisMonthTotal: string;
  thisMonthCount: number;
  lastMonthTotal: string;
  deltaPct: number | null;
  topCategories: Array<{ name: string; total: string; count: number }>;
  topGroup: { name: string; count: number; share: string } | null;
  projectedMonthTotal: number | null;
  balanceNet: number | null;
}): { system: string; user: string } {
  const system = `You write brief, friendly personal finance insights (2-3 sentences max) based on aggregate spending stats.
Do not invent numbers — use only the data provided. No bullet lists. Plain prose.

Return JSON matching the provided response schema with a single "narrative" field.`;

  const user = JSON.stringify(summary, null, 2);
  return { system, user };
}

export type { ParsedFilterDraft };
