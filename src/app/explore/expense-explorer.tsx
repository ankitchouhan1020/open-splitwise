"use client";

import { ExpenseDetailDrawer } from "@/components/expense-detail-drawer";
import { HighlightText } from "@/components/highlight-text";
import type { ExpenseDetail, ExpenseListItem } from "@/lib/expenses/queries";
import { filtersToSearchParams } from "@/lib/expenses/filters";
import { ExpenseFiltersPanel } from "@/app/explore/expense-filters-panel";
import { SavedViewsPanel } from "@/app/explore/saved-views-panel";
import { useExpenseFilters } from "@/app/explore/use-expense-filters";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 100;
const ROW_HEIGHT = 44;

type ListResponse = {
  items: ExpenseListItem[];
  total: number;
  page: number;
  pageSize: number;
};

type SummaryResponse = {
  count: number;
  byCurrency: Array<{ currency: string; myShareTotal: string }>;
};

type FilterOptions = {
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
};

function formatMoney(currency: string, amount: string | null) {
  if (amount == null) return "—";
  const n = Number(amount);
  return `${currency} ${Number.isFinite(n) ? n.toFixed(2) : amount}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ExpenseExplorer() {
  const {
    filters,
    setFilters,
    clearFilter,
    clearAll,
    applySavedView,
    activeFilterChips,
  } = useExpenseFilters();

  const searchRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<ExpenseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [options, setOptions] = useState<FilterOptions>({
    groups: [],
    friends: [],
    categories: [],
    currencies: [],
  });
  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ExpenseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const sort = filters.sort ?? "date";
  const order = filters.order ?? "desc";

  useEffect(() => {
    setSearchInput(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    fetch("/api/filters/options")
      .then((r) => r.json())
      .then((data: FilterOptions) => setOptions(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== (filters.q ?? "")) {
        setFilters({ q: searchInput || undefined });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput, filters.q, setFilters]);

  const loadedPages = Math.ceil(rows.length / PAGE_SIZE);
  const hasMore = rows.length < total;

  const listParams = useCallback(
    (page?: number) =>
      filtersToSearchParams({
        ...filters,
        page: page ?? 1,
        pageSize: PAGE_SIZE,
        sort,
        order,
      }),
    [filters, sort, order],
  );

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await fetch(`/api/expenses?${listParams(page)}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to load expenses");
      }
      return (await res.json()) as ListResponse;
    },
    [listParams],
  );

  const fetchSummary = useCallback(async () => {
    const params = filtersToSearchParams(filters);
    const res = await fetch(`/api/expenses/summary?${params}`);
    if (!res.ok) return null;
    return (await res.json()) as SummaryResponse;
  }, [filters]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, summaryData] = await Promise.all([
        fetchPage(1),
        fetchSummary(),
      ]);
      setRows(data.items);
      setTotal(data.total);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setRows([]);
      setTotal(0);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, fetchSummary]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(loadedPages + 1);
      setRows((prev) => [...prev, ...data.items]);
    } catch {
      /* keep rows */
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadedPages, loadingMore]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const rowVirtualizer = useVirtualizer({
    count: total,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= rows.length - 20 && hasMore && !loadingMore) {
      void loadMore();
    }
  }, [virtualItems, rows.length, hasMore, loadingMore, loadMore]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/expenses/${selectedId}`)
      .then((res) => res.json())
      .then((data) => setDetail(data as ExpenseDetail))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  function toggleSort(key: "date" | "cost" | "description") {
    if (sort === key) {
      setFilters({ order: order === "desc" ? "asc" : "desc" });
    } else {
      setFilters({
        sort: key,
        order: key === "date" ? "desc" : "asc",
      });
    }
  }

  const sortIndicator = (key: "date" | "cost" | "description") => {
    if (sort !== key) return "";
    return order === "desc" ? " ↓" : " ↑";
  };

  const labelMaps = {
    groups: new Map(options.groups.map((g) => [g.id, g.name])),
    friends: new Map(options.friends.map((f) => [f.id, f.name])),
    categories: new Map(options.categories.map((c) => [c.id, c.name])),
  };
  const chips = activeFilterChips(filters, labelMaps);

  function formatShareTotals(totals: SummaryResponse["byCurrency"]) {
    if (totals.length === 0) return "—";
    return totals
      .map((t) => formatMoney(t.currency, t.myShareTotal))
      .join(" · ");
  }

  function exportCsv() {
    const params = filtersToSearchParams({ ...filters, sort, order });
    window.location.href = `/api/expenses/export?${params}`;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <SavedViewsPanel currentFilters={filters} onApply={applySavedView} />

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={searchRef}
            type="search"
            placeholder="Search descriptions, notes, comments… (/)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border-border min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="border-border rounded-lg border px-3 py-2 text-sm"
          >
            {showFilters ? "Hide filters" : "Filters"}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="border-border rounded-lg border px-3 py-2 text-sm"
          >
            Export CSV
          </button>
        </div>

        {showFilters && (
          <ExpenseFiltersPanel
            filters={filters}
            options={options}
            onChange={(patch) => setFilters(patch)}
          />
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => clearFilter(chip.key)}
                className="border-border rounded-full border bg-stone-50 px-2 py-0.5 text-xs hover:bg-stone-100"
              >
                {chip.label} ×
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-accent text-xs underline"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="border-border bg-card flex flex-wrap items-baseline justify-between gap-2 rounded-lg border px-4 py-3">
          <p className="text-foreground text-sm font-medium">
            {loading
              ? "Loading…"
              : `${(summary?.count ?? total).toLocaleString()} expenses`}
          </p>
          <p className="text-muted text-sm">
            {loading ? (
              "…"
            ) : (
              <>
                My share:{" "}
                <span className="text-foreground font-medium">
                  {formatShareTotals(summary?.byCurrency ?? [])}
                </span>
              </>
            )}
            {!loading && loadingMore && " · loading more…"}
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {!loading && total === 0 && !error && (
          <p className="text-muted rounded-xl border border-dashed p-8 text-center text-sm">
            {filters.q
              ? "No expenses match your search."
              : "No expenses yet. Go to Settings and run Sync now."}
          </p>
        )}

        {total > 0 && (
          <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="border-border grid grid-cols-[110px_1fr_120px_100px_90px_90px_100px_56px] gap-2 border-b bg-stone-50 px-3 py-2 text-xs font-medium tracking-wide uppercase">
              <button
                type="button"
                onClick={() => toggleSort("date")}
                className="text-left"
              >
                Date{sortIndicator("date")}
              </button>
              <button
                type="button"
                onClick={() => toggleSort("description")}
                className="text-left"
              >
                Description{sortIndicator("description")}
              </button>
              <span>Group</span>
              <span>Category</span>
              <button
                type="button"
                onClick={() => toggleSort("cost")}
                className="text-left"
              >
                Total{sortIndicator("cost")}
              </button>
              <span>My share</span>
              <span>Paid by</span>
              <span>Cur.</span>
            </div>

            <div
              ref={parentRef}
              className="h-[calc(100vh-320px)] overflow-auto"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const expense = rows[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {expense ? (
                        <button
                          type="button"
                          onClick={() => setSelectedId(expense.id)}
                          className="border-border grid w-full grid-cols-[110px_1fr_120px_100px_90px_90px_100px_56px] gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-teal-50/50"
                          style={{ minHeight: ROW_HEIGHT }}
                        >
                          <span className="text-muted">
                            {formatDate(expense.date)}
                          </span>
                          <span className="truncate font-medium">
                            <HighlightText
                              text={expense.description}
                              query={filters.q ?? ""}
                            />
                            {expense.payment && (
                              <span className="text-muted ml-1 text-xs">
                                (payment)
                              </span>
                            )}
                          </span>
                          <span className="truncate">{expense.groupName}</span>
                          <span className="truncate">
                            {expense.categoryName ?? "—"}
                          </span>
                          <span>
                            {formatMoney(expense.currencyCode, expense.cost)}
                          </span>
                          <span>
                            {formatMoney(expense.currencyCode, expense.myShare)}
                          </span>
                          <span className="truncate">{expense.paidBy}</span>
                          <span className="text-muted">
                            {expense.currencyCode}
                          </span>
                        </button>
                      ) : (
                        <div
                          className="text-muted flex items-center px-3 text-sm"
                          style={{ height: ROW_HEIGHT }}
                        >
                          Loading row…
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <ExpenseDetailDrawer
          expense={detail}
          loading={detailLoading}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
