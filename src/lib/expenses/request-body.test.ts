import { describe, expect, it } from "vitest";
import {
  isCategoryOnlyPatch,
  parseExpenseCategoryPatchBody,
} from "@/lib/expenses/request-body";

describe("parseExpenseCategoryPatchBody", () => {
  it("detects category-only patches", () => {
    expect(isCategoryOnlyPatch({ categoryId: 15 })).toBe(true);
    expect(
      isCategoryOnlyPatch({
        categoryId: 15,
        description: "Coffee",
        cost: "5.00",
        currencyCode: "USD",
      }),
    ).toBe(false);
  });

  it("parses valid category ids", () => {
    expect(parseExpenseCategoryPatchBody({ categoryId: 15 })).toEqual({
      ok: true,
      categoryId: 15,
    });
  });

  it("rejects invalid category ids", () => {
    expect(parseExpenseCategoryPatchBody({ categoryId: 0 })).toEqual({
      error: "invalid_category",
    });
    expect(parseExpenseCategoryPatchBody({ categoryId: "x" })).toEqual({
      error: "invalid_category",
    });
  });
});
