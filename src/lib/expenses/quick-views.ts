import type { DashboardSummary } from "@/lib/expenses/dashboard";
import {
  filtersToSearchParams,
  type ExpenseFilters,
} from "@/lib/expenses/filters";

export type QuickView = {
  id: string;
  label: string;
  href: string;
};

function exploreHref(filters: ExpenseFilters): string {
  const qs = filtersToSearchParams(filters).toString();
  return qs ? `/explore?${qs}` : "/explore";
}

function last30Range(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
}

function truncateLabel(text: string, max = 22): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Contextual Explore shortcuts for the home header — not duplicating main nav. */
export function buildDashboardQuickViews(data: DashboardSummary): QuickView[] {
  const views: QuickView[] = [];
  const monthBase: ExpenseFilters = {
    dateFrom: data.thisMonth.dateFrom,
    dateTo: data.thisMonth.dateTo,
    payment: false,
    currency: data.currency,
  };

  const topGroup = data.topGroups[0];
  if (topGroup && topGroup.expenseCount > 0) {
    views.push({
      id: `group-${topGroup.groupId}`,
      label: truncateLabel(topGroup.groupName),
      href: exploreHref({ ...monthBase, groupId: topGroup.groupId }),
    });
  }

  const topCategory = data.topCategories[0];
  if (topCategory?.categoryId != null && topCategory.count > 0) {
    views.push({
      id: `category-${topCategory.categoryId}`,
      label: truncateLabel(topCategory.categoryName),
      href: exploreHref({
        ...monthBase,
        categoryId: topCategory.categoryId,
      }),
    });
  }

  const last30 = last30Range();
  views.push({
    id: "last-30",
    label: "Last 30 days",
    href: exploreHref({
      dateFrom: last30.dateFrom,
      dateTo: last30.dateTo,
      payment: false,
      currency: data.currency,
    }),
  });

  views.push({
    id: "settlements",
    label: "Settlements",
    href: exploreHref({
      dateFrom: data.thisMonth.dateFrom,
      dateTo: data.thisMonth.dateTo,
      payment: true,
      currency: data.currency,
    }),
  });

  if (data.thisMonth.expenseCount > 0) {
    views.push({
      id: "biggest",
      label: "Biggest this month",
      href: exploreHref({
        ...monthBase,
        sort: "cost",
        order: "desc",
      }),
    });
  }

  return views;
}
