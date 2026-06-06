import { describe, expect, it } from "vitest";
import { buildCatalogHints } from "@/lib/ai/catalog-hints";
import type { FilterCatalog } from "@/lib/ai/prompts";

const catalog: FilterCatalog = {
  groups: [
    { id: 1, name: "Roommates" },
    { id: 2, name: "Summer Trip 2024" },
  ],
  friends: [
    { id: 10, name: "Alex Johnson" },
    { id: 11, name: "Alex Smith" },
  ],
  categories: [{ id: 20, name: "Food & Drink" }],
  currencies: ["USD", "EUR"],
};

describe("buildCatalogHints", () => {
  it("returns null when the query has no matchable tokens", () => {
    expect(buildCatalogHints("", catalog)).toBeNull();
    expect(buildCatalogHints("a", catalog)).toBeNull();
  });

  it("returns only entries that match query tokens", () => {
    expect(buildCatalogHints("coffee with Alex in roommates", catalog)).toEqual(
      {
        groups: ["Roommates"],
        friends: ["Alex Johnson", "Alex Smith"],
      },
    );
  });

  it("includes currency codes when mentioned", () => {
    expect(buildCatalogHints("USD expenses last month", catalog)).toEqual({
      currencies: ["USD"],
    });
  });
});
