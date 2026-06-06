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
  ownerName?: string;
}): { system: string; user: string } {
  const catalogJson = JSON.stringify(
    {
      ownerName: input.ownerName,
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
- paidByName / paidToName: who paid whom on an expense (primary payer → primary payee). Use "me" or ownerName for the account owner; first names can match full names in the catalog.
- paidByName alone ("paid by Alex") → only paidByName; omit paidToName unless the user names a payee.
- "I paid Alex", "Alex paid me", "Alex paid Jordan" → set paidByName/paidToName; do NOT set payment unless the user asks for settlements.
- payment: true ONLY for settlement/payment records ("settlements", "paid back", "settled up"). payment: false for regular expenses only.
- payment is separate from paidByName/paidToName — who paid a dinner bill is NOT a settlement.
- Do not set friendName when paidByName/paidToName capture the relationship.
- "how much", "total", "sum": pick the best filters; totals appear above the expense list.
- "last year": rolling 365 days ending today unless the user clearly means the previous calendar year.`;

  const user = `Catalog (groups, friends, categories, currencies):
${catalogJson}

User query: ${JSON.stringify(input.query)}`;

  return { system, user };
}

export type NarrativePromptData = {
  today: string;
  currency: string;
  thisMonth: {
    total: string;
    count: number;
    daysElapsed: number;
    daysInMonth: number;
  };
  lastMonth: { total: string; count: number };
  change: { amount: number; percent: number | null };
  projectedMonthTotal: number | null;
  topCategories: Array<{ name: string; total: string; count: number }>;
  topGroups: Array<{
    name: string;
    count: number;
    share: string;
    percentOfTotal: number;
  }>;
  monthlyTrend: Array<{ month: string; total: string; count: number }>;
  balances: {
    youAreOwed: number;
    youOwe: number;
    net: number;
    topOwedToYou: Array<{ name: string; amount: number }>;
    topYouOwe: Array<{ name: string; amount: number }>;
  } | null;
  recentHighlights: Array<{
    description: string;
    amount: string;
    date: string;
    group: string;
    category: string | null;
  }>;
  signals: Array<{ headline: string; detail: string }>;
};

export function buildNarrativePrompt(summary: NarrativePromptData): {
  system: string;
  user: string;
} {
  const system = `You write brief personal finance observations (2-3 sentences) for a Splitwise user's home dashboard.

Today's date is ${summary.today}. All amounts use currency ${summary.currency}.

Rules:
- Use ONLY numbers and names from the JSON data. Never invent figures.
- Do NOT lead with the month total — the user already sees it on screen.
- Pick 1-2 specific, interesting signals: month-over-month change, category or group concentration, spending pace vs projection, balance with named friends, or a notable recent expense.
- Prefer concrete comparisons ("up 18% vs last month", "Groceries is 40% of spend") over vague statements.
- Avoid generic advice ("keep tracking", "review your budget", "stay mindful") and empty platitudes.
- Plain prose only — no bullet lists.

Return JSON matching the provided response schema with a single "narrative" field.`;

  const user = JSON.stringify(summary, null, 2);
  return { system, user };
}

export type { ParsedFilterDraft };
