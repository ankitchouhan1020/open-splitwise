"use client";

import { ExpenseDetailDrawer } from "@/components/expense-detail-drawer";
import { ExpenseTableSkeleton } from "@/components/expense-table-skeleton";
import {
  ExpenseListItemRow,
  ExpenseListMonthHeader,
} from "@/components/expense-list-item";
import { formatMoney } from "@/lib/format";
import type { ExpenseListItem } from "@/lib/expenses/types";
import { filtersToSearchParams } from "@/lib/expenses/filters";
import {
  buildExpenseListSections,
  sectionHeight,
} from "@/lib/expenses/list-sections";
import { ExpenseFiltersPanel } from "@/app/explore/expense-filters-panel";
import { ExploreGroupPills } from "@/app/explore/explore-group-pills";
import { ExploreSavedViews } from "@/app/explore/explore-saved-views";
import {
  ExploreToolbar,
  detectDatePreset,
} from "@/app/explore/explore-toolbar";
import { useExpenseFilters } from "@/app/explore/use-expense-filters";
import {
  useExploreContext,
  useExpenseDetail,
  useFilterOptions,
} from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 350;

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

function shareSummary(
  totals: SummaryResponse["byCurrency"],
  formatMoney: (amount: number, currency: string) => string,
): string {
  if (totals.length === 0) return "—";
  return totals
    .map((t) => formatMoney(Number(t.myShareTotal), t.currency))
    .join(" · ");
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.q ?? "");
  const debouncedSearch = useDebouncedValue(searchDraft, SEARCH_DEBOUNCE_MS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: filterOptions } = useFilterOptions();
  const options = useMemo<FilterOptions>(
    () =>
      filterOptions ?? {
        groups: [],
        friends: [],
        categories: [],
        currencies: [],
      },
    [filterOptions],
  );
  const { data: groupStats = [] } = useExploreContext();
  const { data: detail, isLoading: detailLoading } =
    useExpenseDetail(selectedId);

  const sort = filters.sort ?? "date";
  const order = filters.order ?? "desc";

  // Apply debounced search to URL (replace, not push — avoids history spam).
  useEffect(() => {
    const next = debouncedSearch.trim() || undefined;
    if (next === filters.q) return;
    setFilters({ q: next }, true);
  }, [debouncedSearch, filters.q, setFilters]);

  // Sync input from URL only when idle (not mid-keystroke or awaiting apply).
  useEffect(() => {
    if (searchDraft.trim() !== debouncedSearch.trim()) return;
    const urlQ = filters.q ?? "";
    if (searchDraft !== urlQ) setSearchDraft(urlQ);
  }, [filters.q, debouncedSearch, searchDraft]);

  const searchPending =
    searchDraft.trim() !== debouncedSearch.trim() ||
    debouncedSearch.trim() !== (filters.q ?? "").trim();

  const handleClearAll = useCallback(() => {
    setSearchDraft("");
    clearAll();
  }, [clearAll]);

  const handleApplySavedView = useCallback(
    (viewFilters: Parameters<typeof applySavedView>[0]) => {
      setSearchDraft(viewFilters.q ?? "");
      applySavedView(viewFilters);
    },
    [applySavedView],
  );

  const handleClearFilter = useCallback(
    (key: string) => {
      if (key === "q") setSearchDraft("");
      clearFilter(key);
    },
    [clearFilter],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchDraft(value);
      if (!value.trim()) {
        setFilters({ q: undefined }, true);
      }
    },
    [setFilters],
  );

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const listQueryKey = listParams(1).toString();
  const summaryQueryKey = filtersToSearchParams(filters).toString();

  const {
    data: page1,
    isLoading: loading,
    isFetching: listFetching,
    isPlaceholderData: listIsPlaceholder,
    error: listError,
  } = useQuery({
    queryKey: queryKeys.expenses.list(listQueryKey),
    queryFn: () => fetchPage(1),
    placeholderData: keepPreviousData,
  });

  const { data: summary, isFetching: summaryFetching } = useQuery({
    queryKey: queryKeys.expenses.summary(summaryQueryKey),
    queryFn: fetchSummary,
    placeholderData: keepPreviousData,
  });

  const error =
    listError instanceof Error
      ? listError.message
      : listError
        ? "Load failed"
        : null;

  useEffect(() => {
    if (page1 && !listIsPlaceholder) {
      setRows(page1.items);
      setTotal(page1.total);
    }
  }, [page1, listIsPlaceholder]);

  const listRefreshing = listFetching && !loading && rows.length > 0;
  const showInitialSkeleton = loading && rows.length === 0;
  const showEmptyState =
    !showInitialSkeleton && !listRefreshing && total === 0 && !error;

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [listQueryKey]);

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

  const listSections = useMemo(
    () => buildExpenseListSections(rows, sort === "date"),
    [rows, sort],
  );

  const rowVirtualizer = useVirtualizer({
    count: listSections.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => sectionHeight(listSections[index]!),
    overscan: 15,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    let expenseCount = 0;
    for (let i = 0; i <= last.index && i < listSections.length; i++) {
      if (listSections[i]?.kind === "expense") expenseCount++;
    }
    if (expenseCount >= rows.length - 20 && hasMore && !loadingMore) {
      void loadMore();
    }
  }, [virtualItems, listSections, rows.length, hasMore, loadingMore, loadMore]);

  const labelMaps = useMemo(
    () => ({
      groups: new Map(options.groups.map((g) => [g.id, g.name])),
      friends: new Map(options.friends.map((f) => [f.id, f.name])),
      categories: new Map(options.categories.map((c) => [c.id, c.name])),
    }),
    [options],
  );

  const chips = activeFilterChips(filters, labelMaps).filter((chip) => {
    if (chip.key === "q") return false;
    if (chip.key === "group") {
      return !groupStats.some((g) => g.groupId === filters.groupId);
    }
    if (chip.key === "date" && detectDatePreset(filters) !== "all") {
      return false;
    }
    return true;
  });

  function exportCsv() {
    window.location.href = `/api/expenses/export?${filtersToSearchParams({ ...filters, sort, order })}`;
  }

  const count = summary?.count ?? total;

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="shrink-0 space-y-2">
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <ExploreSavedViews
            currentFilters={filters}
            onApply={handleApplySavedView}
            onClear={handleClearAll}
          />

          <ExploreToolbar
            filters={filters}
            searchInput={searchDraft}
            onSearchChange={handleSearchChange}
            searchPending={searchPending || listRefreshing || summaryFetching}
            searchRef={searchRef}
            onChange={(patch) => setFilters(patch)}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((v) => !v)}
            onExport={exportCsv}
            visibleGroupIds={groupStats.map((g) => g.groupId)}
          />

          {groupStats.length > 0 && (
            <div className="border-border border-t px-3 pb-3">
              <p className="text-muted mb-1.5 text-[11px] font-medium tracking-wide uppercase">
                Groups
              </p>
              <ExploreGroupPills
                groups={groupStats}
                activeGroupId={filters.groupId}
                onSelectGroup={(id) => setFilters({ groupId: id, page: 1 })}
              />
            </div>
          )}

          {filtersOpen && (
            <div className="border-border border-t px-3 py-3">
              <ExpenseFiltersPanel
                filters={filters}
                options={options}
                onChange={(patch) => setFilters(patch)}
              />
            </div>
          )}
        </div>

        {(chips.length > 0 || !showInitialSkeleton) && (
          <div className="flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
            {!showInitialSkeleton && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-foreground font-medium tabular-nums">
                  {count.toLocaleString()} expenses
                </span>
                <span className="text-muted font-normal">
                  · my share{" "}
                  {shareSummary(summary?.byCurrency ?? [], formatMoney)}
                </span>
                {(searchPending || listRefreshing) && (
                  <span className="text-muted font-normal">· searching…</span>
                )}
              </div>
            )}
            {!showInitialSkeleton && (
              <label className="text-muted flex items-center gap-1.5 font-normal sm:ml-auto">
                Sort
                <select
                  value={`${sort}:${order}`}
                  onChange={(e) => {
                    const [s, o] = e.target.value.split(":");
                    setFilters({
                      sort: s as "date" | "cost" | "description",
                      order: o as "asc" | "desc",
                    });
                  }}
                  className="border-border text-foreground rounded border bg-white px-2 py-1 text-xs"
                >
                  <option value="date:desc">Newest</option>
                  <option value="date:asc">Oldest</option>
                  <option value="cost:desc">Highest share</option>
                  <option value="cost:asc">Lowest share</option>
                  <option value="description:asc">A → Z</option>
                  <option value="description:desc">Z → A</option>
                </select>
              </label>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleClearFilter(chip.key)}
                  className="border-border rounded bg-stone-100 px-1.5 py-0.5 hover:bg-stone-200"
                >
                  {chip.label} ×
                </button>
              ))}
              {chips.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-accent hover:underline"
                >
                  Clear
                </button>
              )}
              {loadingMore && <span className="text-muted">Loading more…</span>}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-800">
            {error}
          </p>
        )}
      </div>

      {showInitialSkeleton ? (
        <ExpenseTableSkeleton rows={12} />
      ) : showEmptyState ? (
        <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
          {filters.q ? "No matches." : "No expenses in this view."}
        </p>
      ) : (
        total > 0 && (
          <div
            className={`border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border transition-opacity ${listRefreshing ? "opacity-60" : ""}`}
          >
            <div
              ref={parentRef}
              className="max-h-[calc(100dvh-18rem-env(safe-area-inset-bottom))] min-h-0 flex-1 overflow-auto md:max-h-[calc(100vh-220px)]"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const section = listSections[virtualRow.index];
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
                      {section?.kind === "month" ? (
                        <ExpenseListMonthHeader label={section.label} />
                      ) : section?.kind === "expense" ? (
                        <ExpenseListItemRow
                          expense={section.expense}
                          searchQuery={filters.q ?? ""}
                          onSelect={() => setSelectedId(section.expense.id)}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}

      <ExpenseDetailDrawer
        expense={detail ?? null}
        loading={detailLoading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
