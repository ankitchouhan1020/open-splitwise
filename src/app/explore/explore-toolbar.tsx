"use client";

import type { ExpenseFilters } from "@/lib/expenses/filters";
import {
  expenseDateInputValue,
  localDayEndIso,
  localDayStartIso,
} from "@/lib/expenses/date-filters";

type DatePreset = "all" | "thisMonth" | "last30" | "thisYear";

type ActivityPreset = "all" | "expenses" | "settlements";

export type ExploreDatePreset = DatePreset;
export type ExploreActivityPreset = ActivityPreset;

export const EXPLORE_ACTIVITY_PRESETS: {
  id: ActivityPreset;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "expenses", label: "Expenses" },
  { id: "settlements", label: "Settlements" },
];

export const EXPLORE_DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "thisMonth", label: "This month" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisYear", label: "This year" },
];

export function detectActivityPreset(filters: ExpenseFilters): ActivityPreset {
  if (filters.payment === true) return "settlements";
  if (filters.payment === false) return "expenses";
  return "all";
}

export function activityPresetPatch(
  preset: ActivityPreset,
): Pick<ExpenseFilters, "payment"> {
  if (preset === "settlements") return { payment: true };
  if (preset === "expenses") return { payment: false };
  return { payment: undefined };
}

const DATE_PRESETS: { id: DatePreset; label: string }[] = EXPLORE_DATE_PRESETS;

export function datePresetRange(preset: DatePreset): {
  dateFrom?: string;
  dateTo?: string;
} {
  if (preset === "all") return { dateFrom: undefined, dateTo: undefined };
  const now = new Date();
  switch (preset) {
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        dateFrom: localDayStartIso(from),
        dateTo: localDayEndIso(now),
      };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return {
        dateFrom: localDayStartIso(from),
        dateTo: localDayEndIso(now),
      };
    }
    case "thisYear": {
      const from = new Date(now.getFullYear(), 0, 1);
      return {
        dateFrom: localDayStartIso(from),
        dateTo: localDayEndIso(now),
      };
    }
  }
}

export function detectDatePreset(filters: ExpenseFilters): DatePreset {
  if (!filters.dateFrom && !filters.dateTo) return "all";
  const from = filters.dateFrom
    ? expenseDateInputValue(filters.dateFrom)
    : undefined;
  const to = filters.dateTo ? expenseDateInputValue(filters.dateTo) : undefined;
  for (const p of DATE_PRESETS) {
    if (p.id === "all") continue;
    const range = datePresetRange(p.id);
    if (
      expenseDateInputValue(range.dateFrom) === from &&
      expenseDateInputValue(range.dateTo) === to
    ) {
      return p.id;
    }
  }
  return "all";
}

/** Filters in the collapsible refine panel (not primary Type/When/Group). */
export function countRefineFilters(
  filters: ExpenseFilters,
  groupStats: Array<{ groupId: number }>,
): number {
  let n = 0;
  if (filters.friendId !== undefined) n++;
  if (filters.paidByUserId !== undefined) n++;
  if (filters.paidToUserId !== undefined) n++;
  if (filters.categoryId !== undefined) n++;
  if (filters.currency) n++;
  if (filters.costMin != null || filters.costMax != null) n++;
  if (filters.shareMin != null || filters.shareMax != null) n++;

  if (filters.groupId !== undefined) {
    const inPills = groupStats.some((g) => g.groupId === filters.groupId);
    if (!inPills) n++;
  }

  return n;
}
