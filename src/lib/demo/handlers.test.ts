import { describe, expect, it } from "vitest";
import {
  demoDashboardSummary,
  demoListExpenses,
  demoFilterOptions,
} from "@/lib/demo/handlers";

describe("demo handlers", () => {
  it("returns sample expenses", () => {
    const result = demoListExpenses({ page: 1, pageSize: 100 });
    expect(result.total).toBeGreaterThan(10);
    expect(result.items[0]?.description).toBeTruthy();
  });

  it("filters by search query", () => {
    const result = demoListExpenses({ q: "Trader" });
    expect(result.total).toBe(1);
    expect(result.items[0]?.description).toContain("Trader");
  });

  it("builds dashboard summary with balances", () => {
    const summary = demoDashboardSummary();
    expect(summary.balances).not.toBeNull();
    expect(summary.recentExpenses.length).toBeGreaterThan(0);
    expect(summary.currency).toBe("USD");
  });

  it("exposes filter options", () => {
    const options = demoFilterOptions();
    expect(options.groups.length).toBeGreaterThan(0);
    expect(options.currencies).toContain("USD");
  });
});
