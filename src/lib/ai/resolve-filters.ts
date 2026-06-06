import type {
  ExpenseFilters,
  ExpenseListOrder,
  ExpenseListSort,
} from "@/lib/expenses/filters";
import type { ParsedFilterDraft } from "@/lib/ai/schema";
import type { FilterCatalog } from "@/lib/ai/prompts";

const SORT_KEYS: ExpenseListSort[] = ["date", "cost", "description"];
const SELF_NAME = /^(me|i|myself|my)$/i;

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

type NameMatch =
  | { status: "matched"; id: number }
  | { status: "not_found" }
  | { status: "ambiguous"; names: string[] };

function matchByName(
  name: string | undefined,
  items: Array<{ id: number; name: string }>,
): NameMatch {
  if (!name?.trim()) return { status: "not_found" };
  const needle = normalize(name);

  const exact = items.find((item) => normalize(item.name) === needle);
  if (exact) return { status: "matched", id: exact.id };

  const contains = items.filter((item) =>
    normalize(item.name).includes(needle),
  );
  if (contains.length === 1) return { status: "matched", id: contains[0]!.id };
  if (contains.length > 1) {
    return {
      status: "ambiguous",
      names: contains.map((item) => item.name),
    };
  }

  const reverse = items.filter((item) => needle.includes(normalize(item.name)));
  if (reverse.length === 1) return { status: "matched", id: reverse[0]!.id };
  if (reverse.length > 1) {
    return {
      status: "ambiguous",
      names: reverse.map((item) => item.name),
    };
  }

  return { status: "not_found" };
}

function resolveNamedId(
  name: string | undefined,
  items: Array<{ id: number; name: string }>,
  label: string,
  warnings: string[],
): number | undefined {
  if (!name?.trim()) return undefined;

  const match = matchByName(name, items);
  if (match.status === "matched") return match.id;

  if (match.status === "ambiguous") {
    warnings.push(
      `${label} "${name.trim()}" matches multiple: ${match.names.join(", ")}`,
    );
    return undefined;
  }

  warnings.push(`${label} "${name.trim()}" not found`);
  return undefined;
}

function resolveParticipantId(
  name: string | undefined,
  catalog: FilterCatalog,
  ownerSplitwiseId: number | undefined,
  label: string,
  warnings: string[],
): number | undefined {
  if (!name?.trim()) return undefined;
  if (ownerSplitwiseId && SELF_NAME.test(name.trim())) {
    return ownerSplitwiseId;
  }
  return resolveNamedId(name, catalog.friends, label, warnings);
}

function parseIsoDate(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return value.slice(0, 10);
}

function validCurrency(
  value: string | undefined,
  allowed: string[],
  warnings: string[],
): string | undefined {
  if (!value?.trim()) return undefined;
  const upper = value.trim().toUpperCase();
  if (allowed.includes(upper)) return upper;
  warnings.push(`Currency "${value.trim()}" not in your data`);
  return undefined;
}

function parseSort(value: string | undefined): ExpenseListSort | undefined {
  if (!value) return undefined;
  return SORT_KEYS.includes(value as ExpenseListSort)
    ? (value as ExpenseListSort)
    : undefined;
}

function parseOrder(value: string | undefined): ExpenseListOrder | undefined {
  if (value === "asc" || value === "desc") return value;
  return undefined;
}

export type ResolveFilterContext = {
  ownerSplitwiseId?: number;
};

export function resolveParsedFilters(
  draft: ParsedFilterDraft,
  catalog: FilterCatalog,
  context: ResolveFilterContext = {},
): { filters: ExpenseFilters; explanation: string; warnings: string[] } {
  const filters: ExpenseFilters = {};
  const warnings: string[] = [];

  const q = draft.q?.trim();
  if (q) filters.q = q;

  const dateFrom = parseIsoDate(draft.dateFrom);
  const dateTo = parseIsoDate(draft.dateTo);
  if (dateFrom) filters.dateFrom = dateFrom;
  else if (draft.dateFrom?.trim()) {
    warnings.push(`Start date "${draft.dateFrom.trim()}" is invalid`);
  }
  if (dateTo) filters.dateTo = dateTo;
  else if (draft.dateTo?.trim()) {
    warnings.push(`End date "${draft.dateTo.trim()}" is invalid`);
  }

  const groupId = resolveNamedId(
    draft.groupName,
    catalog.groups,
    "Group",
    warnings,
  );
  if (groupId !== undefined) filters.groupId = groupId;

  const paidByUserId = resolveParticipantId(
    draft.paidByName,
    catalog,
    context.ownerSplitwiseId,
    "Payer",
    warnings,
  );
  if (paidByUserId !== undefined) filters.paidByUserId = paidByUserId;

  const paidToUserId = resolveParticipantId(
    draft.paidToName,
    catalog,
    context.ownerSplitwiseId,
    "Payee",
    warnings,
  );
  if (paidToUserId !== undefined) filters.paidToUserId = paidToUserId;

  const hasDirection = paidByUserId !== undefined || paidToUserId !== undefined;

  if (!hasDirection) {
    const friendId = resolveNamedId(
      draft.friendName,
      catalog.friends,
      "Friend",
      warnings,
    );
    if (friendId !== undefined) filters.friendId = friendId;
  }

  const categoryId = resolveNamedId(
    draft.categoryName,
    catalog.categories,
    "Category",
    warnings,
  );
  if (categoryId !== undefined) filters.categoryId = categoryId;

  const currency = validCurrency(draft.currency, catalog.currencies, warnings);
  if (currency) filters.currency = currency;

  if (draft.payment === true || draft.payment === false) {
    filters.payment = draft.payment;
  } else if (hasDirection) {
    filters.payment = true;
  }

  if (typeof draft.costMin === "number" && Number.isFinite(draft.costMin)) {
    filters.costMin = draft.costMin;
  }
  if (typeof draft.costMax === "number" && Number.isFinite(draft.costMax)) {
    filters.costMax = draft.costMax;
  }
  if (typeof draft.shareMin === "number" && Number.isFinite(draft.shareMin)) {
    filters.shareMin = draft.shareMin;
  }
  if (typeof draft.shareMax === "number" && Number.isFinite(draft.shareMax)) {
    filters.shareMax = draft.shareMax;
  }

  const sort = parseSort(draft.sort);
  if (sort) filters.sort = sort;
  else if (draft.sort?.trim()) {
    warnings.push(`Sort "${draft.sort.trim()}" is not supported`);
  }

  const order = parseOrder(draft.order);
  if (order) filters.order = order;

  return {
    filters,
    explanation: draft.explanation.trim(),
    warnings,
  };
}
