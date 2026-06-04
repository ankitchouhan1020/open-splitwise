/** Build searchable comment/details supplement for FTS. */
export function buildExpenseSearchText(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(" ");
}

/** Split a search query into terms for highlighting (letters/numbers). */
export function searchTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export type HighlightPart = { text: string; match: boolean };

/** Split text into matched / non-matched segments for UI highlighting. */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const terms = searchTerms(query);
  if (!terms.length || !text) {
    return [{ text, match: false }];
  }

  const pattern = new RegExp(
    `(${terms.map((t) => escapeRegExp(t)).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern).filter((p) => p.length > 0);
  if (parts.length <= 1) {
    return [{ text, match: false }];
  }

  return parts.map((part) => ({
    text: part,
    match: terms.some((t) => part.toLowerCase() === t),
  }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
