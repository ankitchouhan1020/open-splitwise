"use client";

import type { DashboardSummary } from "@/lib/expenses/dashboard";
import type { ExpenseDetail } from "@/lib/expenses/types";
import type { ExploreGroupStat } from "@/lib/expenses/explore-context";
import { fetchSplitwiseCategoryIconMap } from "@/lib/splitwise/category-icon";
import { fetchJson } from "@/lib/query/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import type { SyncStatus } from "@/components/sync-status-provider";
import { useQuery } from "@tanstack/react-query";

export type FilterOptions = {
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
};

export type ExpenseFormSuggestions = {
  defaultCurrency: string;
  descriptions: string[];
  groups: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string; count: number }>;
};

export type GroupMembersResponse = {
  members: Array<{ id: number; name: string }>;
  currentUserId: number;
};

const FILTER_OPTIONS_STALE = 5 * 60_000;
const SUGGESTIONS_STALE = 2 * 60_000;
const GROUP_MEMBERS_STALE = 5 * 60_000;

export function useFilterOptions() {
  return useQuery({
    queryKey: queryKeys.filters.options(),
    queryFn: () => fetchJson<FilterOptions>("/api/filters/options"),
    staleTime: FILTER_OPTIONS_STALE,
  });
}

export function useExpenseSuggestions() {
  return useQuery({
    queryKey: queryKeys.expenses.suggestions(),
    queryFn: async () => {
      const data = await fetchJson<ExpenseFormSuggestions | { error?: string }>(
        "/api/expenses/suggestions",
      );
      if ("error" in data && !("descriptions" in data)) {
        return null;
      }
      return data as ExpenseFormSuggestions;
    },
    staleTime: SUGGESTIONS_STALE,
  });
}

export function useGroupMembers(groupId: number | null) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId ?? 0),
    queryFn: () =>
      fetchJson<GroupMembersResponse>(`/api/groups/${groupId}/members`),
    enabled: groupId != null && groupId > 0,
    staleTime: GROUP_MEMBERS_STALE,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => fetchJson<DashboardSummary>("/api/dashboard"),
  });
}

export function useExpenseDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id ?? 0),
    queryFn: () => fetchJson<ExpenseDetail>(`/api/expenses/${id}`),
    enabled: id != null,
  });
}

export function useExploreContext() {
  return useQuery({
    queryKey: queryKeys.explore.context(),
    queryFn: () =>
      fetchJson<{ groups: ExploreGroupStat[] }>("/api/explore/context"),
    staleTime: FILTER_OPTIONS_STALE,
    select: (data) => data.groups ?? [],
  });
}

export function useSyncStatusQuery(enabled: boolean, localSyncing: boolean) {
  return useQuery({
    queryKey: queryKeys.sync.status(),
    queryFn: () => fetchJson<SyncStatus>("/api/sync/status"),
    enabled,
    refetchInterval: (query) => {
      if (!enabled) return false;
      if (localSyncing) return 1500;
      return query.state.data?.inProgress ? 1500 : false;
    },
  });
}

export type InsightsQueryParams = {
  from: string;
  to: string;
  groupId: string;
  currency: string;
};

export function insightsParamsKey({
  from,
  to,
  groupId,
  currency,
}: InsightsQueryParams): string {
  const params = new URLSearchParams();
  if (from) params.set("from", new Date(from).toISOString());
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    params.set("to", end.toISOString());
  }
  if (groupId) params.set("group", groupId);
  if (currency) params.set("currency", currency);
  return params.toString();
}

export type InsightsData = {
  summary: {
    totalSpend: string;
    expenseCount: number;
    currency: string | null;
    topCategory: {
      categoryId: number | null;
      categoryName: string;
      total: string;
    } | null;
  };
  monthly: Array<{
    month: string;
    currency: string;
    total: string;
    count: number;
  }>;
  categories: Array<{
    categoryId: number | null;
    categoryName: string;
    total: string;
    count: number;
  }>;
  trends: {
    currentTotal: string;
    previousTotal: string;
    yearAgoTotal: string;
    categories: Array<{
      categoryId: number | null;
      categoryName: string;
      current: string;
      previous: string;
      yearAgo: string;
      delta: number;
      deltaPct: number | null;
      yoyDelta: number;
      yoyDeltaPct: number | null;
    }>;
  };
  groups: Array<{
    groupId: number;
    groupName: string;
    expenseCount: number;
    myShareTotal: string;
    percentOfTotal: number;
  }>;
  friends: Array<{
    friendId: number;
    friendName: string;
    myShareTotal: string;
    expenseCount: number;
  }>;
};

export function useInsights(params: InsightsQueryParams) {
  const key = insightsParamsKey(params);
  return useQuery({
    queryKey: queryKeys.insights.filtered(key),
    queryFn: () => fetchJson<InsightsData>(`/api/insights?${key}`),
  });
}

const CATEGORY_ICONS_STALE = 24 * 60 * 60_000;

export function useCategoryIconMap() {
  return useQuery({
    queryKey: queryKeys.categories.icons(),
    queryFn: () => fetchSplitwiseCategoryIconMap(),
    staleTime: CATEGORY_ICONS_STALE,
    gcTime: CATEGORY_ICONS_STALE,
  });
}
