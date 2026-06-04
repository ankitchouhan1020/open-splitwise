"use client";

import { useExpenseSuggestions, useFilterOptions } from "@/lib/query/hooks";

export type ExpenseFormGroup = { id: number; name: string };
export type ExpenseFormCategory = { id: number; name: string };
export type { ExpenseFormSuggestions } from "@/lib/query/hooks";

export function useExpenseFormOptions() {
  const optionsQuery = useFilterOptions();
  const suggestionsQuery = useExpenseSuggestions();

  const loading = optionsQuery.isLoading || suggestionsQuery.isLoading;

  const groups = (optionsQuery.data?.groups ?? []).filter((g) => g.id > 0);
  const categories = optionsQuery.data?.categories ?? [];
  const currencies = optionsQuery.data?.currencies ?? [];
  const suggestions = suggestionsQuery.data ?? null;

  const defaultCurrency =
    suggestions?.defaultCurrency ?? currencies[0] ?? "USD";
  const defaultGroup = suggestions?.groups[0] ?? null;

  return {
    loading,
    groups,
    categories,
    currencies,
    suggestions,
    defaultCurrency,
    defaultGroup,
  };
}
