import type {
  ExpenseFilters,
  ExpenseListOrder,
  ExpenseListSort,
} from "@/lib/expenses/filters";
import type { ParsedFilterDraft } from "@/lib/ai/schema";
import type { FilterCatalog } from "@/lib/ai/prompts";

const SORT_KEYS: ExpenseListSort[] = [
  "date",
  "expenseDate",
  "cost",
  "description",
];
const SELF_NAME = /^(me|i|myself|my|you)$/i;

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

  const wordMatch = items.filter((item) =>
    normalize(item.name)
      .split(/\s+/)
      .filter(Boolean)
      .some((part) => part === needle || part.startsWith(needle)),
  );
  if (wordMatch.length === 1)
    return { status: "matched", id: wordMatch[0]!.id };
  if (wordMatch.length > 1) {
    return {
      status: "ambiguous",
      names: wordMatch.map((item) => item.name),
    };
  }

  return { status: "not_found" };
}

function participantItems(
  catalog: FilterCatalog,
  context: ResolveFilterContext,
): Array<{ id: number; name: string }> {
  const items = [...catalog.friends];
  if (context.ownerSplitwiseId != null && context.ownerName?.trim()) {
    const owner = {
      id: context.ownerSplitwiseId,
      name: context.ownerName.trim(),
    };
    if (!items.some((f) => f.id === owner.id)) {
      items.unshift(owner);
    }
  }
  return items;
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
  context: ResolveFilterContext,
  label: string,
  warnings: string[],
): number | undefined {
  if (!name?.trim()) return undefined;
  if (context.ownerSplitwiseId && SELF_NAME.test(name.trim())) {
    return context.ownerSplitwiseId;
  }
  return resolveNamedId(
    name,
    participantItems(catalog, context),
    label,
    warnings,
  );
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

function participantDisplayName(
  id: number,
  catalog: FilterCatalog,
  context: ResolveFilterContext,
): string {
  if (context.ownerSplitwiseId != null && id === context.ownerSplitwiseId) {
    return context.ownerName?.trim() || "You";
  }
  const friend = catalog.friends.find((f) => f.id === id);
  return friend?.name ?? `User ${id}`;
}

function groupDisplayName(id: number, catalog: FilterCatalog): string {
  if (id === 0) return "No group";
  return catalog.groups.find((g) => g.id === id)?.name ?? `Group ${id}`;
}

function categoryDisplayName(id: number, catalog: FilterCatalog): string {
  return catalog.categories.find((c) => c.id === id)?.name ?? `Category ${id}`;
}

function formatDateRange(from?: string, to?: string): string | undefined {
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return undefined;
}

function formatAmountBound(
  min?: number,
  max?: number,
  label = "Total",
): string | undefined {
  if (min != null && max != null) return `${label} ${min}–${max}`;
  if (min != null) return `${label} over ${min}`;
  if (max != null) return `${label} under ${max}`;
  return undefined;
}

function formatSort(filters: ExpenseFilters): string | undefined {
  if (filters.sort === "cost" && filters.order === "desc")
    return "Biggest first";
  if (filters.sort === "cost" && filters.order === "asc")
    return "Smallest first";
  if (filters.sort === "date" && filters.order === "asc")
    return "Recent (oldest)";
  if (filters.sort === "date" && filters.order === "desc") return "Recent";
  if (filters.sort === "expenseDate" && filters.order === "asc")
    return "Expense date (oldest)";
  if (filters.sort === "expenseDate" && filters.order === "desc")
    return "Expense date (newest)";
  if (filters.sort === "description" && filters.order === "asc") {
    return "A–Z";
  }
  if (filters.sort === "description" && filters.order === "desc") {
    return "Z–A";
  }
  return undefined;
}

export function buildFilterExplanation(
  filters: ExpenseFilters,
  catalog: FilterCatalog,
  context: ResolveFilterContext = {},
): string {
  const parts: string[] = [];

  if (filters.q) parts.push(filters.q);

  if (filters.paidByUserId != null || filters.paidToUserId != null) {
    const payer =
      filters.paidByUserId != null
        ? participantDisplayName(filters.paidByUserId, catalog, context)
        : null;
    const payee =
      filters.paidToUserId != null
        ? participantDisplayName(filters.paidToUserId, catalog, context)
        : null;
    const payerIsOwner =
      context.ownerSplitwiseId != null &&
      filters.paidByUserId === context.ownerSplitwiseId;
    const payeeIsOwner =
      context.ownerSplitwiseId != null &&
      filters.paidToUserId === context.ownerSplitwiseId;

    if (payer && payee) {
      const by = payerIsOwner ? "You" : payer;
      const to = payeeIsOwner ? "you" : payee;
      parts.push(`${by} paid ${to}`);
    } else if (payer) {
      parts.push(`Paid by ${payerIsOwner ? "you" : payer}`);
    } else if (payee) {
      parts.push(`Paid to ${payeeIsOwner ? "you" : payee}`);
    }
  } else if (filters.friendId != null) {
    parts.push(
      `With ${participantDisplayName(filters.friendId, catalog, context)}`,
    );
  }

  if (filters.groupId != null) {
    parts.push(groupDisplayName(filters.groupId, catalog));
  }
  if (filters.categoryId != null) {
    parts.push(categoryDisplayName(filters.categoryId, catalog));
  }

  const dates = formatDateRange(filters.dateFrom, filters.dateTo);
  if (dates) parts.push(dates);

  if (filters.payment === true) parts.push("Settlements");
  if (filters.payment === false) parts.push("Expenses only");
  if (filters.currency) parts.push(filters.currency);

  const total = formatAmountBound(filters.costMin, filters.costMax, "Total");
  if (total) parts.push(total);

  const share = formatAmountBound(
    filters.shareMin,
    filters.shareMax,
    "My share",
  );
  if (share) parts.push(share);

  const sort = formatSort(filters);
  if (sort) parts.push(sort);

  return parts.length > 0 ? parts.join(" · ") : "Matching expenses";
}

export type ResolveFilterContext = {
  ownerSplitwiseId?: number;
  ownerName?: string;
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
    context,
    "Payer",
    warnings,
  );
  if (paidByUserId !== undefined) filters.paidByUserId = paidByUserId;

  const paidToUserId = resolveParticipantId(
    draft.paidToName,
    catalog,
    context,
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
    explanation: buildFilterExplanation(filters, catalog, context),
    warnings,
  };
}
