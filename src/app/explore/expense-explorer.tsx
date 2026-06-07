"use client";

import { useDemoMode } from "@/components/demo-mode-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpenseDetailDrawer } from "@/components/expense-detail-drawer";
import { ExpenseTableSkeleton } from "@/components/expense-table-skeleton";
import {
  ExpenseListItemRow,
  ExpenseListMonthHeader,
} from "@/components/expense-list-item";
import { formatMoney } from "@/lib/format";
import type { ExpenseListItem } from "@/lib/expenses/types";
import {
  filtersToSearchParams,
  type ExpenseFilters,
} from "@/lib/expenses/filters";
import {
  buildExpenseListSections,
  sectionHeight,
} from "@/lib/expenses/list-sections";
import { ExploreAiCard } from "@/app/explore/explore-ai-card";
import { ExploreFiltersCard } from "@/app/explore/explore-filters-card";
import { detectDatePreset } from "@/app/explore/explore-toolbar";
import {
  friendlyAiError,
  friendlyApiError,
  friendlyExpenseError,
} from "@/lib/api-errors";
import { FetchJsonError } from "@/lib/query/fetch-json";
import { useExpenseFilters } from "@/app/explore/use-expense-filters";
import {
  useExploreContext,
  useExpenseDetail,
  useFilterOptions,
  useAiStatus,
  useParseFilters,
  useCategoryIconMap,
} from "@/lib/query/hooks";
import {
  categoryFieldsFromSuggestion,
  useApplyExpenseCategory,
  useCategorySuggestions,
} from "@/components/use-category-suggestions";
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
  byCurrency: Array<{
    currency: string;
    myShareTotal: string;
    myPaidShareTotal: string;
    payerTotal: string;
  }>;
};

type FilterOptions = {
  ownerUserId: number;
  ownerName: string;
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
};

function isAggregateQuery(query: string): boolean {
  return /\b(how much|how many|total|sum|amount)\b/i.test(query);
}

function currencySummary(
  totals: SummaryResponse["byCurrency"],
  field: "myShareTotal" | "myPaidShareTotal" | "payerTotal",
  formatMoney: (amount: number, currency: string) => string,
): string {
  if (totals.length === 0) return "—";
  return totals
    .map((t) => formatMoney(Number(t[field]), t.currency))
    .join(" · ");
}

function hasDirectionalFilters(filters: ExpenseFilters): boolean {
  return filters.paidByUserId != null || filters.paidToUserId != null;
}

export function ExpenseExplorer() {
  const {
    filters,
    setFilters,
    clearFilter,
    clearAll,
    applyFilters,
    activeFilterChips,
  } = useExpenseFilters();

  const searchRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<ExpenseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const debouncedSearch = useDebouncedValue(searchDraft, SEARCH_DEBOUNCE_MS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [aiShowTotal, setAiShowTotal] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [categoryReviewEnabled, setCategoryReviewEnabled] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const searchQ = debouncedSearch.trim() || undefined;

  const demoMode = useDemoMode();
  const { data: aiAvailable = false } = useAiStatus();
  const aiInteractive = aiAvailable && !demoMode;
  const parseFilters = useParseFilters();
  const { data: categoryIconMap } = useCategoryIconMap();
  const { applyCategory, applyingId } = useApplyExpenseCategory();

  const { data: filterOptions } = useFilterOptions();
  const options = useMemo<FilterOptions>(
    () =>
      filterOptions ?? {
        ownerUserId: 0,
        ownerName: "You",
        groups: [],
        friends: [],
        categories: [],
        currencies: [],
      },
    [filterOptions],
  );
  const { data: exploreContext } = useExploreContext();
  const groupStats = exploreContext?.groups ?? [];
  const topCategories = exploreContext?.topCategories ?? [];
  const { data: detail, isLoading: detailLoading } =
    useExpenseDetail(selectedId);

  const sort = filters.sort ?? "date";
  const order = filters.order ?? "desc";

  const effectiveFilters = useMemo(
    () => ({ ...filters, q: searchQ }),
    [filters, searchQ],
  );

  const searchPending = searchDraft.trim() !== debouncedSearch.trim();

  const handleClearAll = useCallback(() => {
    setSearchDraft("");
    setAiPrompt("");
    setAiExplanation(null);
    setAiWarnings([]);
    setAiShowTotal(false);
    setAiError(null);
    clearAll();
  }, [clearAll]);

  const handleClearFilter = useCallback(
    (key: string) => {
      if (key === "q") setSearchDraft("");
      clearFilter(key);
    },
    [clearFilter],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchDraft(value);
  }, []);

  const handleAiPromptChange = useCallback((value: string) => {
    setAiPrompt(value);
    setAiExplanation(null);
    setAiWarnings([]);
    setAiShowTotal(false);
    setAiError(null);
  }, []);

  const dismissAiResult = useCallback(() => {
    setAiExplanation(null);
    setAiWarnings([]);
    setAiShowTotal(false);
    setAiError(null);
  }, []);

  const handleSmartFilter = useCallback(async () => {
    const query = aiPrompt.trim();
    if (!query || !aiInteractive) return;
    setAiError(null);
    setAiExplanation(null);
    setAiWarnings([]);
    setAiShowTotal(false);
    try {
      const result = await parseFilters.mutateAsync(query);
      setAiExplanation(result.explanation);
      setAiWarnings(result.warnings);
      setAiShowTotal(isAggregateQuery(query));
      const textQuery = result.filters.q?.trim();
      if (textQuery) {
        setSearchDraft(textQuery);
      }
      const urlFilters = { ...result.filters };
      delete urlFilters.q;
      applyFilters({ ...urlFilters, page: 1 });
    } catch (err) {
      setAiExplanation(null);
      setAiWarnings([]);
      setAiShowTotal(false);
      setAiError(
        err instanceof FetchJsonError
          ? friendlyAiError(err.message)
          : friendlyAiError(undefined),
      );
    }
  }, [aiInteractive, aiPrompt, applyFilters, parseFilters]);

  const handleExampleQuery = useCallback(
    (query: string) => {
      handleAiPromptChange(query);
    },
    [handleAiPromptChange],
  );

  const loadedPages = Math.ceil(rows.length / PAGE_SIZE);
  const hasMore = rows.length < total;

  const listParams = useCallback(
    (page?: number) =>
      filtersToSearchParams({
        ...effectiveFilters,
        page: page ?? 1,
        pageSize: PAGE_SIZE,
        sort,
        order,
      }),
    [effectiveFilters, sort, order],
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
    const params = filtersToSearchParams(effectiveFilters);
    const res = await fetch(`/api/expenses/summary?${params}`);
    if (!res.ok) return null;
    return (await res.json()) as SummaryResponse;
  }, [effectiveFilters]);

  const expenseIds = useMemo(() => rows.map((r) => r.id), [rows]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "/" && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      if (inField || expenseIds.length === 0) return;

      const idx = selectedId != null ? expenseIds.indexOf(selectedId) : -1;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = idx < expenseIds.length - 1 ? idx + 1 : 0;
        setSelectedId(expenseIds[next] ?? null);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : expenseIds.length - 1;
        setSelectedId(expenseIds[prev] ?? null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expenseIds, selectedId]);

  const listQueryKey = listParams(1).toString();
  const summaryQueryKey = filtersToSearchParams(effectiveFilters).toString();

  const {
    suggestions: categorySuggestions,
    pending: categorySuggestionsPending,
    error: categorySuggestionsError,
    dismissSuggestion,
    suggestionCount,
  } = useCategorySuggestions(rows, categoryReviewEnabled, listQueryKey);

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

  const error = listError
    ? friendlyApiError(
        listError instanceof Error ? listError.message : undefined,
        "Couldn't load expenses. Try syncing from the header.",
      )
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
    () =>
      buildExpenseListSections(
        rows,
        sort === "date" || sort === "expenseDate",
        sort === "expenseDate" ? "expense" : "updated",
      ),
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
      friends: new Map([
        ...(options.ownerUserId
          ? [[options.ownerUserId, options.ownerName] as const]
          : []),
        ...options.friends.map((f) => [f.id, f.name] as const),
      ]),
      categories: new Map(options.categories.map((c) => [c.id, c.name])),
    }),
    [options],
  );

  const chips = activeFilterChips(filters, labelMaps).filter((chip) => {
    if (chip.key === "q") return false;
    if (chip.key === "payment") return false;
    if (chip.key === "group") {
      return !groupStats.some((g) => g.groupId === filters.groupId);
    }
    if (chip.key === "date" && detectDatePreset(filters) !== "all") {
      return false;
    }
    return true;
  });

  function exportCsv() {
    window.location.href = `/api/expenses/export?${filtersToSearchParams({ ...effectiveFilters, sort, order })}`;
  }

  const handleApplyCategory = useCallback(
    async (expenseId: number) => {
      const suggestion = categorySuggestions.get(expenseId);
      if (!suggestion) return;

      setApplyError(null);
      const result = await applyCategory(expenseId, suggestion.categoryId);
      if ("error" in result) {
        setApplyError(
          friendlyExpenseError(
            result.error,
            undefined,
            "Couldn't update the category. Try again.",
          ),
        );
        return;
      }

      dismissSuggestion(expenseId);
      setRows((prev) =>
        prev.map((row) =>
          row.id === expenseId
            ? {
                ...row,
                ...categoryFieldsFromSuggestion(suggestion, categoryIconMap),
              }
            : row,
        ),
      );
    },
    [applyCategory, categoryIconMap, categorySuggestions, dismissSuggestion],
  );

  const count = summary?.count ?? total;

  const aiTotalLine = useMemo(() => {
    if (!aiShowTotal || !summary || summaryFetching) return null;

    const directional = hasDirectionalFilters(filters);
    const field =
      directional || filters.payment === true ? "payerTotal" : "myShareTotal";
    const amountLabel = directional
      ? filters.paidByUserId === options.ownerUserId
        ? "you paid"
        : "paid"
      : filters.payment === true
        ? "you paid"
        : "my share";
    const amounts = currencySummary(summary.byCurrency, field, formatMoney);
    return `${summary.count.toLocaleString()} expenses · ${amountLabel} ${amounts}`;
  }, [aiShowTotal, summary, summaryFetching, filters, options.ownerUserId]);

  const summaryAmountLabel = useMemo(() => {
    if (hasDirectionalFilters(filters)) {
      return filters.paidByUserId === options.ownerUserId ? "you paid" : "paid";
    }
    if (filters.payment === true) return "you paid";
    return "my share";
  }, [filters, options.ownerUserId]);

  const summaryAmountField = useMemo((): "payerTotal" | "myShareTotal" => {
    if (hasDirectionalFilters(filters) || filters.payment === true) {
      return "payerTotal";
    }
    return "myShareTotal";
  }, [filters]);

  const listColumn = (
    <>
      <div className="shrink-0 space-y-2">
        <ExploreAiCard
          prompt={aiPrompt}
          onPromptChange={handleAiPromptChange}
          onAskAi={() => void handleSmartFilter()}
          onExampleQuery={handleExampleQuery}
          pending={parseFilters.isPending}
          groupStats={groupStats}
          topCategories={topCategories}
          friends={options.friends}
          explanation={aiExplanation}
          warnings={aiWarnings}
          totalLine={aiTotalLine}
          error={aiError}
          onDismissResult={dismissAiResult}
          disabled={!aiInteractive}
          demoMode={demoMode}
          categoryReviewEnabled={categoryReviewEnabled}
          onCategoryReviewToggle={() => {
            setCategoryReviewEnabled((value) => !value);
            setApplyError(null);
          }}
          categoryReviewPending={categorySuggestionsPending}
          categoryReviewSuggestionCount={suggestionCount}
          categoryReviewError={categorySuggestionsError ?? applyError}
        />

        <ExploreFiltersCard
          filters={filters}
          searchInput={searchDraft}
          onSearchChange={handleSearchChange}
          searchPending={searchPending || listRefreshing || summaryFetching}
          searchRef={searchRef}
          onChange={(patch) => setFilters(patch)}
          refineOpen={refineOpen}
          onToggleRefine={() => setRefineOpen((v) => !v)}
          onExport={exportCsv}
          groupStats={groupStats}
          options={options}
          count={count}
          amountLabel={summaryAmountLabel}
          amounts={currencySummary(
            summary?.byCurrency ?? [],
            summaryAmountField,
            formatMoney,
          )}
          summaryPending={searchPending || listRefreshing || summaryFetching}
          sort={sort}
          order={order}
          onSortChange={(s, o) =>
            setFilters({
              sort: s as "date" | "expenseDate" | "cost" | "description",
              order: o as "asc" | "desc",
            })
          }
          chips={chips}
          onClearFilter={handleClearFilter}
          onClearAll={handleClearAll}
          loadingMore={loadingMore}
          summaryHidden={showInitialSkeleton}
        />

        {error && (
          <p className="bg-error-bg text-error-text rounded-md px-2 py-1 text-xs">
            {error}
          </p>
        )}
      </div>

      {showInitialSkeleton ? (
        <ExpenseTableSkeleton rows={12} />
      ) : showEmptyState ? (
        <EmptyState variant="dashed">
          {searchQ ? "No matches." : "No expenses in this view."}
        </EmptyState>
      ) : (
        total > 0 && (
          <div
            className={`border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border transition-opacity ${listRefreshing ? "opacity-60" : ""}`}
          >
            <div
              ref={parentRef}
              className="max-h-[calc(100dvh-16rem-env(safe-area-inset-bottom))] min-h-0 flex-1 overflow-auto md:max-h-[calc(100dvh-12rem)]"
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
                          searchQuery={searchQ ?? ""}
                          selected={selectedId === section.expense.id}
                          onSelect={() => setSelectedId(section.expense.id)}
                          categorySuggestion={
                            categoryReviewEnabled
                              ? categorySuggestions.get(section.expense.id)
                              : undefined
                          }
                          onApplyCategory={
                            categoryReviewEnabled
                              ? () =>
                                  void handleApplyCategory(section.expense.id)
                              : undefined
                          }
                          applyingCategory={applyingId === section.expense.id}
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
    </>
  );

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {listColumn}
      <ExpenseDetailDrawer
        expense={detail ?? null}
        loading={detailLoading}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
