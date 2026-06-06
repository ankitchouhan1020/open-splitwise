export type ExpenseListSort = "date" | "cost" | "description";
export type ExpenseListOrder = "asc" | "desc";

export type ExpenseFilters = {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  groupId?: number;
  friendId?: number;
  /** Splitwise user id of who paid (primary payer on the expense). */
  paidByUserId?: number;
  /** Splitwise user id of who received (primary payee / max owed share). */
  paidToUserId?: number;
  categoryId?: number;
  currency?: string;
  /** When set, filter payment vs non-payment expenses. */
  payment?: boolean;
  costMin?: number;
  costMax?: number;
  shareMin?: number;
  shareMax?: number;
  sort?: ExpenseListSort;
  order?: ExpenseListOrder;
  page?: number;
  pageSize?: number;
};

export type SerializedExpenseFilters = Record<string, string>;

const SORT_KEYS: ExpenseListSort[] = ["date", "cost", "description"];

function parseNumber(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseDateParam(value: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : value;
}

export function parseExpenseFilters(params: URLSearchParams): ExpenseFilters {
  const sort = params.get("sort") as ExpenseListSort | null;
  const order = params.get("order") === "asc" ? "asc" : "desc";
  const paymentRaw = params.get("payment");

  let payment: boolean | undefined;
  if (paymentRaw === "1" || paymentRaw === "true") payment = true;
  if (paymentRaw === "0" || paymentRaw === "false") payment = false;

  return {
    q: params.get("q")?.trim() || undefined,
    dateFrom: parseDateParam(params.get("from")),
    dateTo: parseDateParam(params.get("to")),
    groupId: parseNumber(params.get("group")),
    friendId: parseNumber(params.get("friend")),
    paidByUserId: parseNumber(params.get("paidBy")),
    paidToUserId: parseNumber(params.get("paidTo")),
    categoryId: parseNumber(params.get("category")),
    currency: params.get("currency")?.trim() || undefined,
    payment,
    costMin: parseNumber(params.get("costMin")),
    costMax: parseNumber(params.get("costMax")),
    shareMin: parseNumber(params.get("shareMin")),
    shareMax: parseNumber(params.get("shareMax")),
    sort: sort && SORT_KEYS.includes(sort) ? sort : "date",
    order,
    page: parseNumber(params.get("page")) ?? 1,
    pageSize: parseNumber(params.get("pageSize")) ?? 100,
  };
}

export function filtersToSearchParams(
  filters: ExpenseFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === "") return;
    params.set(key, String(value));
  };

  set("q", filters.q);
  set("from", filters.dateFrom);
  set("to", filters.dateTo);
  if (filters.groupId !== undefined) set("group", filters.groupId);
  set("friend", filters.friendId);
  set("paidBy", filters.paidByUserId);
  set("paidTo", filters.paidToUserId);
  set("category", filters.categoryId);
  set("currency", filters.currency);
  if (filters.payment === true) params.set("payment", "1");
  if (filters.payment === false) params.set("payment", "0");
  set("costMin", filters.costMin);
  set("costMax", filters.costMax);
  set("shareMin", filters.shareMin);
  set("shareMax", filters.shareMax);
  if (filters.sort && filters.sort !== "date") set("sort", filters.sort);
  if (filters.order && filters.order !== "desc") set("order", filters.order);
  if (filters.page && filters.page !== 1) set("page", filters.page);
  if (filters.pageSize && filters.pageSize !== 100) {
    set("pageSize", filters.pageSize);
  }

  return params;
}

export function exploreHref(filters: ExpenseFilters = {}): string {
  const params = filtersToSearchParams(filters);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

/** Hide settlement payments when drilling into a group or friend. */
export const GROUP_EXPLORE_DEFAULTS: Pick<ExpenseFilters, "payment"> = {
  payment: false,
};

export function exploreGroupHref(
  groupId: number,
  overrides: ExpenseFilters = {},
): string {
  return exploreHref({
    ...GROUP_EXPLORE_DEFAULTS,
    groupId,
    ...overrides,
  });
}

export function exploreFriendHref(
  friendId: number,
  overrides: ExpenseFilters = {},
): string {
  return exploreHref({
    ...GROUP_EXPLORE_DEFAULTS,
    friendId,
    ...overrides,
  });
}

/** Defaults when opening Explore from Home people/groups feeds. */
export function peopleGroupExploreHref(
  groupId: number,
  currency?: string,
): string {
  return exploreGroupHref(groupId, currency ? { currency } : {});
}

export function peopleFriendExploreHref(
  friendId: number,
  currency?: string,
): string {
  return exploreFriendHref(friendId, currency ? { currency } : {});
}

export function filtersFromJson(value: unknown): ExpenseFilters {
  if (!value || typeof value !== "object") return {};
  const o = value as Record<string, unknown>;
  const sort = o.sort as ExpenseListSort | undefined;
  return {
    q: typeof o.q === "string" ? o.q : undefined,
    dateFrom: typeof o.dateFrom === "string" ? o.dateFrom : undefined,
    dateTo: typeof o.dateTo === "string" ? o.dateTo : undefined,
    groupId: typeof o.groupId === "number" ? o.groupId : undefined,
    friendId: typeof o.friendId === "number" ? o.friendId : undefined,
    paidByUserId:
      typeof o.paidByUserId === "number" ? o.paidByUserId : undefined,
    paidToUserId:
      typeof o.paidToUserId === "number" ? o.paidToUserId : undefined,
    categoryId: typeof o.categoryId === "number" ? o.categoryId : undefined,
    currency: typeof o.currency === "string" ? o.currency : undefined,
    payment: typeof o.payment === "boolean" ? o.payment : undefined,
    costMin: typeof o.costMin === "number" ? o.costMin : undefined,
    costMax: typeof o.costMax === "number" ? o.costMax : undefined,
    shareMin: typeof o.shareMin === "number" ? o.shareMin : undefined,
    shareMax: typeof o.shareMax === "number" ? o.shareMax : undefined,
    sort: sort && SORT_KEYS.includes(sort) ? sort : undefined,
    order: o.order === "asc" ? "asc" : o.order === "desc" ? "desc" : undefined,
  };
}

export function activeFilterChips(
  filters: ExpenseFilters,
  labels: {
    groups: Map<number, string>;
    friends: Map<number, string>;
    categories: Map<number, string>;
  },
): Array<{ key: string; label: string }> {
  const chips: Array<{ key: string; label: string }> = [];
  if (filters.q) chips.push({ key: "q", label: `Search: ${filters.q}` });
  if (filters.dateFrom || filters.dateTo) {
    chips.push({
      key: "date",
      label: `Date: ${filters.dateFrom ?? "…"} – ${filters.dateTo ?? "…"}`,
    });
  }
  if (filters.groupId !== undefined) {
    const name =
      filters.groupId === 0
        ? "No group"
        : (labels.groups.get(filters.groupId) ?? `Group ${filters.groupId}`);
    chips.push({ key: "group", label: `Group: ${name}` });
  }
  if (filters.friendId !== undefined) {
    chips.push({
      key: "friend",
      label: `Friend: ${labels.friends.get(filters.friendId) ?? filters.friendId}`,
    });
  }
  if (filters.paidByUserId !== undefined) {
    chips.push({
      key: "paidBy",
      label: `Paid by: ${labels.friends.get(filters.paidByUserId) ?? filters.paidByUserId}`,
    });
  }
  if (filters.paidToUserId !== undefined) {
    chips.push({
      key: "paidTo",
      label: `Paid to: ${labels.friends.get(filters.paidToUserId) ?? filters.paidToUserId}`,
    });
  }
  if (filters.categoryId !== undefined) {
    chips.push({
      key: "category",
      label: `Category: ${labels.categories.get(filters.categoryId) ?? filters.categoryId}`,
    });
  }
  if (filters.currency) {
    chips.push({ key: "currency", label: `Currency: ${filters.currency}` });
  }
  if (filters.payment === true) {
    chips.push({ key: "payment", label: "Payments only" });
  }
  if (filters.payment === false) {
    chips.push({ key: "payment", label: "Expenses only" });
  }
  if (filters.costMin !== undefined || filters.costMax !== undefined) {
    chips.push({
      key: "cost",
      label: `Total: ${filters.costMin ?? "…"} – ${filters.costMax ?? "…"}`,
    });
  }
  if (filters.shareMin !== undefined || filters.shareMax !== undefined) {
    chips.push({
      key: "share",
      label: `My share: ${filters.shareMin ?? "…"} – ${filters.shareMax ?? "…"}`,
    });
  }
  return chips;
}
