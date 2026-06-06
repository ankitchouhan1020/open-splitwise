import type { FilterCatalog } from "@/lib/ai/prompts";

const MIN_TOKEN_LEN = 2;
const DEFAULT_MAX_PER_TYPE = 5;

function queryTokens(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length >= MIN_TOKEN_LEN),
    ),
  ];
}

function scoreName(name: string, tokens: string[]): number {
  const parts = name
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  return tokens.reduce((score, token) => {
    if (parts.some((part) => part === token || part.startsWith(token))) {
      return score + 1;
    }
    if (token.length >= 4 && name.toLowerCase().includes(token)) {
      return score + 1;
    }
    return score;
  }, 0);
}

function topNameMatches(
  names: string[],
  tokens: string[],
  limit: number,
): string[] {
  if (tokens.length === 0) return [];

  return names
    .map((name) => ({ name, score: scoreName(name, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((item) => item.name);
}

export type CatalogHints = {
  groups?: string[];
  friends?: string[];
  categories?: string[];
  currencies?: string[];
};

/** Local retrieval: only catalog entries that plausibly match the query. */
export function buildCatalogHints(
  query: string,
  catalog: FilterCatalog,
  options: { maxPerType?: number } = {},
): CatalogHints | null {
  const limit = options.maxPerType ?? DEFAULT_MAX_PER_TYPE;
  const tokens = queryTokens(query);

  const groups = topNameMatches(
    catalog.groups.map((g) => g.name),
    tokens,
    limit,
  );
  const friends = topNameMatches(
    catalog.friends.map((f) => f.name),
    tokens,
    limit,
  );
  const categories = topNameMatches(
    catalog.categories.map((c) => c.name),
    tokens,
    limit,
  );

  const currencies =
    tokens.length > 0
      ? catalog.currencies.filter((code) =>
          tokens.some(
            (token) =>
              code.toLowerCase() === token ||
              code.toLowerCase().includes(token),
          ),
        )
      : [];

  const hints: CatalogHints = {};
  if (groups.length > 0) hints.groups = groups;
  if (friends.length > 0) hints.friends = friends;
  if (categories.length > 0) hints.categories = categories;
  if (currencies.length > 0) hints.currencies = currencies;

  return Object.keys(hints).length > 0 ? hints : null;
}
