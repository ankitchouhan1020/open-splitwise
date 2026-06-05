import { describe, expect, it } from "vitest";
import {
  expenseActivityHeadline,
  expenseSettlementDirection,
} from "@/lib/expenses/activity-copy";
import type { ExpenseListItem } from "@/lib/expenses/types";

function settlement(overrides: Partial<ExpenseListItem> = {}): ExpenseListItem {
  return {
    id: 1,
    splitwiseId: 1,
    date: "2026-01-01T00:00:00.000Z",
    description: "Cash",
    details: null,
    groupId: null,
    groupName: "No group",
    categoryId: null,
    categoryName: null,
    categoryIconUrl: null,
    categoryIconBg: null,
    cost: "50.00",
    currencyCode: "USD",
    myShare: "0.00",
    myPaidShare: "50.00",
    paidBy: "Alex Morgan",
    paidTo: "Jordan Lee",
    payment: true,
    ...overrides,
  };
}

describe("settlement activity copy", () => {
  it("describes when you paid someone", () => {
    const expense = settlement();
    expect(expenseSettlementDirection(expense)).toBe("You paid Jordan Lee");
    expect(expenseActivityHeadline(expense)).toBe("You paid Jordan Lee");
  });

  it("describes when someone paid you", () => {
    const expense = settlement({
      myPaidShare: "0.00",
      myShare: "50.00",
      paidBy: "Jordan Lee",
      paidTo: "Alex Morgan",
    });
    expect(expenseSettlementDirection(expense)).toBe("Jordan Lee paid you");
  });

  it("describes payer and payee when not involved", () => {
    const expense = settlement({
      myPaidShare: null,
      myShare: null,
    });
    expect(expenseSettlementDirection(expense)).toBe(
      "Alex Morgan paid Jordan Lee",
    );
  });
});
