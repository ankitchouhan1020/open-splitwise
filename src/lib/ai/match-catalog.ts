export type NameMatch =
  | { status: "matched"; id: number; name: string }
  | { status: "not_found" }
  | { status: "ambiguous"; names: string[] };

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function matchByName(
  name: string | undefined,
  items: Array<{ id: number; name: string }>,
): NameMatch {
  if (!name?.trim()) return { status: "not_found" };
  const needle = normalize(name);

  const exact = items.find((item) => normalize(item.name) === needle);
  if (exact) return { status: "matched", id: exact.id, name: exact.name };

  const contains = items.filter((item) =>
    normalize(item.name).includes(needle),
  );
  if (contains.length === 1) {
    return {
      status: "matched",
      id: contains[0]!.id,
      name: contains[0]!.name,
    };
  }
  if (contains.length > 1) {
    return {
      status: "ambiguous",
      names: contains.map((item) => item.name),
    };
  }

  const reverse = items.filter((item) => needle.includes(normalize(item.name)));
  if (reverse.length === 1) {
    return {
      status: "matched",
      id: reverse[0]!.id,
      name: reverse[0]!.name,
    };
  }
  if (reverse.length > 1) {
    return {
      status: "ambiguous",
      names: reverse.map((item) => item.name),
    };
  }

  const wordMatch = items.filter((item) =>
    normalize(item.name)
      .split(/\s+/)
      .filter(Boolean)
      .some((part) => part === needle || part.startsWith(needle)),
  );
  if (wordMatch.length === 1) {
    return {
      status: "matched",
      id: wordMatch[0]!.id,
      name: wordMatch[0]!.name,
    };
  }
  if (wordMatch.length > 1) {
    return {
      status: "ambiguous",
      names: wordMatch.map((item) => item.name),
    };
  }

  return { status: "not_found" };
}

export function matchCategoryByName(
  name: string | undefined,
  categories: Array<{ id: number; name: string }>,
): NameMatch {
  return matchByName(name, categories);
}
