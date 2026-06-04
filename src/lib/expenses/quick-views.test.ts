import { describe, expect, it } from "vitest";
import type { DashboardSummary } from "@/lib/expenses/dashboard";
import { buildDashboardQuickViews } from "@/lib/expenses/quick-views";

function baseDashboard(
  overrides: Partial<DashboardSummary> = {},
): DashboardSummary {
  return {
    currency: "USD",
    thisMonth: {
      total: "100",
      expenseCount: 5,
      dateFrom: "2026-06-01T00:00:00.000Z",
      dateTo: "2026-06-04T00:00:00.000Z",
    },
    lastMonth: { total: "80", expenseCount: 4 },
    delta: 20,
    deltaPct: 25,
    topCategories: [
      {
        categoryId: 13,
        categoryName: "Dining out",
        total: "60",
        count: 3,
      },
    ],
    topGroups: [
      {
        groupId: 99,
        groupName: "Roommates",
        expenseCount: 4,
        myShareTotal: "80",
        percentOfTotal: 80,
      },
    ],
    monthlySparkline: [],
    balances: null,
    insights: [],
    recentExpenses: [],
    projectedMonthTotal: null,
    sync: {
      status: "ok",
      lastSyncAt: null,
      expenseCount: 10,
      error: null,
      inProgress: false,
    },
    ...overrides,
  };
}

describe("buildDashboardQuickViews", () => {
  it("includes group, category, and preset views", () => {
    const views = buildDashboardQuickViews(baseDashboard());
    const labels = views.map((v) => v.label);

    expect(labels).toContain("Roommates");
    expect(labels).toContain("Dining out");
    expect(labels).toContain("Last 30 days");
    expect(labels).toContain("Settlements");
    expect(labels).toContain("Biggest this month");
  });

  it("links group filter to explore", () => {
    const views = buildDashboardQuickViews(baseDashboard());
    const group = views.find((v) => v.id === "group-99");
    expect(group?.href).toContain("/explore?");
    expect(group?.href).toContain("group=99");
  });
});
