import { describe, expect, it } from "vitest";
import {
  buildNarrativeFacts,
  hasUsableNarrativeFacts,
  selectNarrativeFacts,
} from "@/lib/ai/narrative-facts";
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
        total: "200.00",
        count: 5,
      },
      {
        categoryId: 2,
        categoryName: "Transport",
        total: "90.00",
        count: 3,
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
      { month: "2026-05", total: "300", count: 9 },
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
        updatedAt: "2026-06-05T00:00:00.000Z",
        description: "Trader Joe's",
        details: null,
        groupId: 10,
        groupName: "Apartment",
        categoryId: 1,
        categoryName: "Groceries",
        categoryIconUrl: null,
        categoryIconBg: null,
        cost: "180.00",
        currencyCode: "USD",
        myShare: "180.00",
        myPaidShare: "180.00",
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

describe("buildNarrativeFacts", () => {
  it("surfaces analytical facts beyond insight card copy", () => {
    const facts = buildNarrativeFacts(sampleSummary(), {
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(facts.length).toBeGreaterThan(0);
    expect(facts.some((fact) => fact.id === "projected-vs-last")).toBe(true);
    expect(facts.some((fact) => fact.id === "category-concentrated")).toBe(
      true,
    );
    expect(
      facts.every(
        (fact) =>
          !fact.text.includes("Spending is up this month") &&
          !fact.text.includes("leads this month"),
      ),
    ).toBe(true);
  });

  it("adds category month-over-month facts when last month data is provided", () => {
    const facts = buildNarrativeFacts(sampleSummary(), {
      now: new Date("2026-06-06T12:00:00.000Z"),
      lastMonthCategories: [
        {
          categoryId: 3,
          categoryName: "Dining",
          total: "150.00",
        },
      ],
    });

    expect(facts.some((fact) => fact.id === "category-leader-changed")).toBe(
      true,
    );
  });
});

describe("selectNarrativeFacts", () => {
  it("rotates facts on regenerate", () => {
    const facts = buildNarrativeFacts(sampleSummary(), {
      now: new Date("2026-06-06T12:00:00.000Z"),
    });
    const initial = selectNarrativeFacts(facts, false).map((fact) => fact.id);
    const refreshed = selectNarrativeFacts(facts, true).map((fact) => fact.id);

    expect(initial.length).toBeGreaterThan(1);
    expect(refreshed).not.toEqual(initial);
  });
});

describe("hasUsableNarrativeFacts", () => {
  it("requires multiple facts or one high-priority fact", () => {
    expect(
      hasUsableNarrativeFacts([
        { id: "a", text: "A", priority: 5 },
        { id: "b", text: "B", priority: 4 },
      ]),
    ).toBe(true);
    expect(hasUsableNarrativeFacts([{ id: "a", text: "A", priority: 8 }])).toBe(
      true,
    );
    expect(hasUsableNarrativeFacts([{ id: "a", text: "A", priority: 4 }])).toBe(
      false,
    );
  });
});
