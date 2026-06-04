"use client";

import { ExpenseDetailDrawer } from "@/components/expense-detail-drawer";
import type { ExpenseDetail, ExpenseListItem } from "@/lib/expenses/queries";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";

type SortKey = "date" | "cost" | "description";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 100;
const ROW_HEIGHT = 44;

type ListResponse = {
  items: ExpenseListItem[];
  total: number;
  page: number;
  pageSize: number;
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
  const parentRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<ExpenseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("date");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ExpenseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadedPages = Math.ceil(rows.length / PAGE_SIZE);
  const hasMore = rows.length < total;

  const fetchPage = useCallback(
    async (page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
        order,
      });
      const res = await fetch(`/api/expenses?${params}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to load expenses");
      }
      return (await res.json()) as ListResponse;
    },
    [sort, order],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPage(1);
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = loadedPages + 1;
      const data = await fetchPage(nextPage);
      setRows((prev) => [...prev, ...data.items]);
    } catch {
      /* keep existing rows */
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

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSort(key);
      setOrder(key === "date" ? "desc" : "asc");
    }
  }

  const sortIndicator = (key: SortKey) => {
    if (sort !== key) return "";
    return order === "desc" ? " ↓" : " ↑";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted text-sm">
          {loading
            ? "Loading…"
            : `${total.toLocaleString()} expenses · showing ${rows.length.toLocaleString()}`}
          {loadingMore && " · loading more…"}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && total === 0 && !error && (
        <p className="text-muted rounded-xl border border-dashed p-8 text-center text-sm">
          No expenses yet. Go to Settings and run Sync now.
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

          <div ref={parentRef} className="h-[calc(100vh-220px)] overflow-auto">
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
                          {expense.description}
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
  );
}
