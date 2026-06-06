import { describe, expect, it } from "vitest";
import { buildNarrativePrompt } from "@/lib/ai/prompts";
import { narrativeCacheKey, narrativeDataFingerprint } from "@/lib/ai/cache";
import {
  buildNarrativeFacts,
  selectNarrativeFacts,
} from "@/lib/ai/narrative-facts";
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
        total: "200.00",
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
    recentExpenses: [],
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
  it("passes analytical facts instead of insight card copy", () => {
    const facts = buildNarrativeFacts(sampleSummary(), {
      now: new Date("2026-06-06T12:00:00.000Z"),
    });
    const data = buildNarrativePromptData(facts, {
      currency: "USD",
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(data.facts.length).toBeGreaterThan(0);
    expect(data.facts[0]).not.toContain("Spending is up this month");
  });
});

describe("buildNarrativePrompt", () => {
  it("uses compact JSON and tells the model not to paraphrase cards", () => {
    const facts = buildNarrativeFacts(sampleSummary(), {
      now: new Date("2026-06-06T12:00:00.000Z"),
    });
    const data = buildNarrativePromptData(facts, {
      currency: "USD",
      refresh: true,
    });
    const { system, user } = buildNarrativePrompt(data);

    expect(system).toContain("NOT to paraphrase those cards");
    expect(system).toContain("regenerate request");
    expect(JSON.parse(user)).toMatchObject({
      facts: expect.arrayContaining([expect.any(String)]),
    });
  });

  it("rotates facts for regenerate prompts", () => {
    const facts = buildNarrativeFacts(sampleSummary(), {
      now: new Date("2026-06-06T12:00:00.000Z"),
    });
    const initial = buildNarrativePromptData(facts, { currency: "USD" }).facts;
    const refreshed = buildNarrativePromptData(facts, {
      currency: "USD",
      refresh: true,
    }).facts;

    expect(selectNarrativeFacts(facts, true).map((fact) => fact.text)).toEqual(
      refreshed,
    );
    expect(refreshed).not.toEqual(initial);
  });
});
