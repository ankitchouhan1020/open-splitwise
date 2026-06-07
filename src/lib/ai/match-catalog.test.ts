import { describe, expect, it } from "vitest";
import { matchCategoryByName } from "@/lib/ai/match-catalog";

const categories = [
  { id: 15, name: "Groceries" },
  { id: 32, name: "Transportation" },
  { id: 8, name: "General" },
];

describe("matchCategoryByName", () => {
  it("matches exact category names", () => {
    expect(matchCategoryByName("Groceries", categories)).toEqual({
      status: "matched",
      id: 15,
      name: "Groceries",
    });
  });

  it("matches case-insensitive names", () => {
    expect(matchCategoryByName("transportation", categories)).toEqual({
      status: "matched",
      id: 32,
      name: "Transportation",
    });
  });

  it("returns not_found for unknown categories", () => {
    expect(matchCategoryByName("Entertainment", categories)).toEqual({
      status: "not_found",
    });
  });
});

describe("suggest category filtering", () => {
  it("includes uncategorized and mismatched only", () => {
    const expenses = [
      { id: 1, categoryId: null },
      { id: 2, categoryId: 8 },
      { id: 3, categoryId: 15 },
    ];
    const draft = [
      { expenseIndex: 0, categoryName: "Groceries" },
      { expenseIndex: 1, categoryName: "Transportation" },
      { expenseIndex: 2, categoryName: "Groceries" },
    ];

    const suggestions = draft.flatMap((item) => {
      const expense = expenses[item.expenseIndex];
      if (!expense) return [];
      const match = matchCategoryByName(item.categoryName, categories);
      if (match.status !== "matched") return [];
      const currentCategoryId = expense.categoryId ?? null;
      if (currentCategoryId === match.id) return [];
      return [
        {
          expenseId: expense.id,
          categoryId: match.id,
          categoryName: match.name,
        },
      ];
    });

    expect(suggestions).toEqual([
      { expenseId: 1, categoryId: 15, categoryName: "Groceries" },
      { expenseId: 2, categoryId: 32, categoryName: "Transportation" },
    ]);
  });
});
