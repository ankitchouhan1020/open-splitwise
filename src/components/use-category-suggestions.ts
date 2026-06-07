"use client";

import { friendlyAiError } from "@/lib/api-errors";
import type { ExpenseListItem } from "@/lib/expenses/types";
import { fetchJson, FetchJsonError } from "@/lib/query/fetch-json";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import type { CategoryIconStyle } from "@/lib/splitwise/category-icon";
import { resolveCategoryIcon } from "@/lib/splitwise/category-icon";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

export type CategorySuggestion = {
  expenseId: number;
  categoryId: number;
  categoryName: string;
};

const SUGGEST_BATCH = 30;

type SuggestResponse = {
  suggestions: CategorySuggestion[];
};

export function useCategorySuggestions(
  expenses: ExpenseListItem[],
  enabled: boolean,
  resetKey: string,
) {
  const [suggestions, setSuggestions] = useState<
    Map<number, CategorySuggestion>
  >(new Map());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedIdsRef = useRef(new Set<number>());
  const skipIdsRef = useRef(new Set<number>());

  const clearSuggestions = useCallback(() => {
    fetchedIdsRef.current.clear();
    skipIdsRef.current.clear();
    setSuggestions(new Map());
    setError(null);
    setPending(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearSuggestions();
    }
  }, [enabled, clearSuggestions]);

  useEffect(() => {
    if (enabled) {
      clearSuggestions();
    }
    // Reset when filters/list change while review mode stays on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) return;

    const toFetch = expenses.filter(
      (expense) =>
        !expense.payment &&
        !fetchedIdsRef.current.has(expense.id) &&
        !skipIdsRef.current.has(expense.id),
    );
    if (toFetch.length === 0) return;

    let cancelled = false;

    async function fetchBatches() {
      setPending(true);
      setError(null);

      for (let i = 0; i < toFetch.length; i += SUGGEST_BATCH) {
        if (cancelled) break;

        const batch = toFetch.slice(i, i + SUGGEST_BATCH);
        try {
          const result = await fetchJson<SuggestResponse>(
            "/api/ai/suggest-categories",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                expenses: batch.map((expense) => ({
                  id: expense.id,
                  description: expense.description,
                  details: expense.details,
                  categoryId: expense.categoryId,
                  categoryName: expense.categoryName,
                })),
              }),
            },
          );

          for (const expense of batch) {
            fetchedIdsRef.current.add(expense.id);
          }

          if (cancelled) break;

          setSuggestions((prev) => {
            const next = new Map(prev);
            for (const suggestion of result.suggestions) {
              if (!skipIdsRef.current.has(suggestion.expenseId)) {
                next.set(suggestion.expenseId, suggestion);
              }
            }
            return next;
          });
        } catch (err) {
          if (!cancelled) {
            for (const expense of batch) {
              fetchedIdsRef.current.delete(expense.id);
            }
            setError(
              err instanceof FetchJsonError
                ? friendlyAiError(err.message, "category")
                : friendlyAiError(undefined, "category"),
            );
          }
          break;
        }
      }

      if (!cancelled) {
        setPending(false);
      }
    }

    void fetchBatches();

    return () => {
      cancelled = true;
    };
  }, [enabled, expenses]);

  const dismissSuggestion = useCallback((expenseId: number) => {
    skipIdsRef.current.add(expenseId);
    setSuggestions((prev) => {
      const next = new Map(prev);
      next.delete(expenseId);
      return next;
    });
  }, []);

  return {
    suggestions,
    pending,
    error,
    dismissSuggestion,
    suggestionCount: suggestions.size,
  };
}

export function useApplyExpenseCategory() {
  const queryClient = useQueryClient();
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const applyCategory = useCallback(
    async (
      expenseId: number,
      categoryId: number,
    ): Promise<{ ok: true } | { error: string }> => {
      setApplyingId(expenseId);
      try {
        const res = await fetch(`/api/expenses/${expenseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          return { error: data.error ?? "update_failed" };
        }
        await invalidateExpenseCaches(queryClient);
        return { ok: true };
      } catch {
        return { error: "network_error" };
      } finally {
        setApplyingId(null);
      }
    },
    [queryClient],
  );

  return { applyCategory, applyingId };
}

export function categoryFieldsFromSuggestion(
  suggestion: CategorySuggestion,
  iconMap: Map<number, CategoryIconStyle> | undefined,
): Pick<
  ExpenseListItem,
  "categoryId" | "categoryName" | "categoryIconUrl" | "categoryIconBg"
> {
  const icon = resolveCategoryIcon(suggestion.categoryId, null, iconMap);
  return {
    categoryId: suggestion.categoryId,
    categoryName: suggestion.categoryName,
    categoryIconUrl: icon?.iconUrl ?? null,
    categoryIconBg: icon?.backgroundColor ?? null,
  };
}
