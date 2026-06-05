"use client";

import type { ExpenseFilters } from "@/lib/expenses/filters";

type DatePreset = "all" | "thisMonth" | "last30" | "thisYear";

type ActivityPreset = "all" | "expenses" | "settlements";

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

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "thisMonth", label: "This month" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisYear", label: "This year" },
];

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function datePresetRange(preset: DatePreset): {
  dateFrom?: string;
  dateTo?: string;
} {
  if (preset === "all") return { dateFrom: undefined, dateTo: undefined };
  const now = new Date();
  switch (preset) {
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "thisYear": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
  }
}

export function detectDatePreset(filters: ExpenseFilters): DatePreset {
  if (!filters.dateFrom && !filters.dateTo) return "all";
  const from = filters.dateFrom?.slice(0, 10);
  const to = filters.dateTo?.slice(0, 10);
  const now = new Date();
  for (const p of DATE_PRESETS) {
    if (p.id === "all") continue;
    const range = datePresetRange(p.id);
    if (
      range.dateFrom?.slice(0, 10) === from &&
      range.dateTo?.slice(0, 10) === to
    ) {
      return p.id;
    }
  }
  if (from === toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))) {
    return "thisMonth";
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
  if (filters.categoryId !== undefined) n++;
  if (filters.currency) n++;
  if (filters.costMin != null || filters.costMax != null) n++;
  if (filters.shareMin != null || filters.shareMax != null) n++;

  const preset = detectDatePreset(filters);
  if ((filters.dateFrom || filters.dateTo) && preset === "all") {
    n++;
  }

  if (filters.groupId !== undefined) {
    const inPills = groupStats.some((g) => g.groupId === filters.groupId);
    if (!inPills) n++;
  }

  return n;
}
