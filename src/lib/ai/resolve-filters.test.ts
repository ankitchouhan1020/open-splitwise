import { describe, expect, it } from "vitest";
import { resolveParsedFilters } from "@/lib/ai/resolve-filters";
import type { FilterCatalog } from "@/lib/ai/prompts";

const catalog: FilterCatalog = {
  groups: [{ id: 10, name: "Roommates" }],
  friends: [
    { id: 20, name: "Alex Johnson" },
    { id: 21, name: "Alex Smith" },
    { id: 30, name: "Nikhil Moghe" },
  ],
  categories: [{ id: 40, name: "Food & Drink" }],
  currencies: ["USD", "EUR"],
};

const ownerContext = { ownerSplitwiseId: 9001 };

describe("resolveParsedFilters", () => {
  it("maps names to ids and keyword search", () => {
    const result = resolveParsedFilters(
      {
        q: "coffee",
        groupName: "roommates",
        friendName: "Johnson",
        categoryName: "food",
        dateFrom: "2025-01-01",
        dateTo: "2025-03-31",
        currency: "usd",
        payment: false,
        costMin: 50,
        sort: "cost",
        order: "desc",
        explanation: "Food with Alex in Q1 over $50, highest first",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters).toEqual({
      q: "coffee",
      groupId: 10,
      friendId: 20,
      categoryId: 40,
      dateFrom: "2025-01-01",
      dateTo: "2025-03-31",
      currency: "USD",
      payment: false,
      costMin: 50,
      sort: "cost",
      order: "desc",
    });
    expect(result.explanation).toBe(
      "Food with Alex in Q1 over $50, highest first",
    );
    expect(result.warnings).toEqual([]);
  });

  it("warns on unknown group names", () => {
    const result = resolveParsedFilters(
      {
        groupName: "Nonexistent Group",
        explanation: "No group match",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters.groupId).toBeUndefined();
    expect(result.warnings).toContain('Group "Nonexistent Group" not found');
  });

  it("warns on ambiguous friend names", () => {
    const result = resolveParsedFilters(
      {
        friendName: "Alex",
        explanation: "With Alex",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters.friendId).toBeUndefined();
    expect(result.warnings[0]).toMatch(/Friend "Alex" matches multiple/);
  });

  it("warns on invalid dates and currencies", () => {
    const result = resolveParsedFilters(
      {
        dateFrom: "not-a-date",
        currency: "XYZ",
        explanation: "Partial",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters.dateFrom).toBeUndefined();
    expect(result.filters.currency).toBeUndefined();
    expect(result.warnings).toContain('Start date "not-a-date" is invalid');
    expect(result.warnings).toContain('Currency "XYZ" not in your data');
  });

  it("maps directional payments and me to owner id", () => {
    const result = resolveParsedFilters(
      {
        paidByName: "me",
        paidToName: "Nikhil",
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
        explanation: "You paid Nikhil Moghe last year",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters).toMatchObject({
      paidByUserId: 9001,
      paidToUserId: 30,
      payment: true,
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
    });
    expect(result.filters.friendId).toBeUndefined();
  });
});
