import { describe, expect, it } from "vitest";
import {
  buildFilterExplanation,
  resolveParsedFilters,
} from "@/lib/ai/resolve-filters";
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

const ownerContext = {
  ownerSplitwiseId: 9001,
  ownerName: "Ankit Chouhan",
};

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
      "coffee · With Alex Johnson · Roommates · Food & Drink · 2025-01-01 – 2025-03-31 · Expenses only · USD · Total over 50 · Biggest first",
    );
    expect(result.warnings).toEqual([]);
  });

  it("warns on unknown group names", () => {
    const result = resolveParsedFilters(
      {
        groupName: "Nonexistent Group",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters.groupId).toBeUndefined();
    expect(result.explanation).toBe("Matching expenses");
    expect(result.warnings).toContain('Group "Nonexistent Group" not found');
  });

  it("warns on ambiguous friend names", () => {
    const result = resolveParsedFilters(
      {
        friendName: "Alex",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters.friendId).toBeUndefined();
    expect(result.explanation).toBe("Matching expenses");
    expect(result.warnings[0]).toMatch(/Friend "Alex" matches multiple/);
  });

  it("warns on invalid dates and currencies", () => {
    const result = resolveParsedFilters(
      {
        dateFrom: "not-a-date",
        currency: "XYZ",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters.dateFrom).toBeUndefined();
    expect(result.filters.currency).toBeUndefined();
    expect(result.explanation).toBe("Matching expenses");
    expect(result.warnings).toContain('Start date "not-a-date" is invalid');
    expect(result.warnings).toContain('Currency "XYZ" not in your data');
  });

  it("maps directional payer/payee without forcing settlements", () => {
    const result = resolveParsedFilters(
      {
        paidByName: "me",
        paidToName: "Nikhil",
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters).toMatchObject({
      paidByUserId: 9001,
      paidToUserId: 30,
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
    });
    expect(result.filters.payment).toBeUndefined();
    expect(result.filters.friendId).toBeUndefined();
    expect(result.explanation).toBe(
      "You paid Nikhil Moghe · 2025-01-01 – 2025-12-31",
    );
  });

  it("matches owner by first name for payer/payee", () => {
    const result = resolveParsedFilters(
      {
        paidByName: "Ankit",
      },
      catalog,
      ownerContext,
    );

    expect(result.filters.paidByUserId).toBe(9001);
    expect(result.explanation).toBe("Paid by you");
    expect(result.warnings).toEqual([]);
  });

  it("sets payment only when the draft explicitly requests it", () => {
    const settlements = resolveParsedFilters(
      {
        paidByName: "Alex Johnson",
        payment: true,
      },
      catalog,
      ownerContext,
    );
    expect(settlements.filters.payment).toBe(true);
    expect(settlements.filters.paidByUserId).toBe(20);
    expect(settlements.explanation).toBe("Paid by Alex Johnson · Settlements");

    const paidByOnly = resolveParsedFilters(
      {
        paidByName: "Alex Johnson",
      },
      catalog,
      ownerContext,
    );
    expect(paidByOnly.filters.paidByUserId).toBe(20);
    expect(paidByOnly.filters.payment).toBeUndefined();
    expect(paidByOnly.explanation).toBe("Paid by Alex Johnson");
  });
});

describe("buildFilterExplanation", () => {
  it("falls back when no filters apply", () => {
    expect(buildFilterExplanation({}, catalog, ownerContext)).toBe(
      "Matching expenses",
    );
  });
});
