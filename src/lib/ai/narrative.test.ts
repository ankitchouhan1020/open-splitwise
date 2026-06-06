import { describe, expect, it } from "vitest";
import { narrativeCacheKey, narrativeDataFingerprint } from "@/lib/ai/cache";
import { buildNarrativePromptData } from "@/lib/ai/narrative";
import type { DashboardSummary } from "@/lib/expenses/dashboard";

function sampleSummary(
  overrides: Partial<DashboardSummary> = {},
): DashboardSummary {
  return {
    currency: "USD",
    thisMonth: {
      total: "420.50",
      expenseCount: 12,
      dateFrom: "2026-06-01T00:00:00.000Z",
      dateTo: "2026-06-06T12:00:00.000Z",
    },
    lastMonth: { total: "300.00", expenseCount: 9 },
    delta: 120.5,
    deltaPct: 40.17,
    topCategories: [
      {
        categoryId: 1,
        categoryName: "Groceries",
        total: "180.00",
        count: 5,
      },
    ],
    topGroups: [
      {
        groupId: 10,
        groupName: "Apartment",
        expenseCount: 7,
        myShareTotal: "250.00",
        percentOfTotal: 59,
      },
    ],
    monthlySparkline: [
      { month: "2026-01", total: "200", count: 8 },
      { month: "2026-06", total: "420.50", count: 12 },
    ],
    balances: {
      currency: "USD",
      youAreOwed: 40,
      youOwe: 10,
      net: 30,
      topOwedToYou: [{ name: "Alex", amount: 40 }],
      topYouOwe: [{ name: "Jordan", amount: 10 }],
    },
    insights: [
      {
        id: "spend-trend",
        headline: "Spending is up this month",
        detail: "+40% vs last month ($420.50 so far).",
        tone: "alert",
      },
    ],
    recentExpenses: [
      {
        id: 1,
        splitwiseId: 1,
        date: "2026-06-05T00:00:00.000Z",
        description: "Trader Joe's",
        details: null,
        groupId: 10,
        groupName: "Apartment",
        categoryId: 1,
        categoryName: "Groceries",
        categoryIconUrl: null,
        categoryIconBg: null,
        cost: "85.00",
        currencyCode: "USD",
        myShare: "42.50",
        myPaidShare: "85.00",
        paidBy: "You",
        paidTo: "",
        payment: false,
      },
    ],
    projectedMonthTotal: 2100,
    sync: {
      status: "ok",
      lastSyncAt: "2026-06-06T10:00:00.000Z",
      expenseCount: 120,
      error: null,
      inProgress: false,
    },
    ...overrides,
  };
}

describe("narrativeDataFingerprint", () => {
  it("changes when synced spending totals change", () => {
    const base = sampleSummary();
    const changed = sampleSummary({
      thisMonth: { ...base.thisMonth, total: "500.00" },
    });
    expect(narrativeDataFingerprint(base)).not.toBe(
      narrativeDataFingerprint(changed),
    );
  });
});

describe("narrativeCacheKey", () => {
  it("includes model and fingerprint", () => {
    const summary = sampleSummary();
    const key = narrativeCacheKey(
      7,
      "2026-06",
      narrativeDataFingerprint(summary),
      "gpt-4o-mini",
    );
    expect(key).toContain("7:2026-06:");
    expect(key).toContain("gpt-4o-mini");
  });
});

describe("buildNarrativePromptData", () => {
  it("includes trend, balances, and recent highlights", () => {
    const data = buildNarrativePromptData(
      sampleSummary(),
      new Date("2026-06-06T12:00:00.000Z"),
    );
    expect(data.monthlyTrend).toHaveLength(2);
    expect(data.balances?.topOwedToYou[0]?.name).toBe("Alex");
    expect(data.recentHighlights[0]?.description).toBe("Trader Joe's");
    expect(data.signals[0]?.headline).toContain("Spending is up");
    expect(data.thisMonth.daysElapsed).toBe(6);
  });
});
