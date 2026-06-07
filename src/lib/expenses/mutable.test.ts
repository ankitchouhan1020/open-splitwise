import { describe, expect, it } from "vitest";
import { isExpenseMutable } from "@/lib/expenses/mutable";
import type { ExpenseDetail } from "@/lib/expenses/types";

function expense(overrides: Partial<ExpenseDetail> = {}): ExpenseDetail {
  return {
    id: 1,
    splitwiseId: 100,
    date: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    description: "Test",
    details: null,
    groupName: "Trip",
    categoryId: null,
    categoryName: null,
    categoryIconUrl: null,
    categoryIconBg: null,
    cost: "10.00",
    currencyCode: "USD",
    myShare: "5.00",
    myPaidShare: "10.00",
    paidBy: "You",
    paidTo: "—",
    payment: false,
    groupId: 42,
    friendshipId: null,
    comments: null,
    shares: [],
    raw: {},
    ...overrides,
  };
}

describe("isExpenseMutable", () => {
  it("allows group expenses", () => {
    expect(isExpenseMutable(expense())).toBe(true);
  });

  it("allows friend expenses", () => {
    expect(
      isExpenseMutable(
        expense({ groupId: null, friendshipId: 3001, groupName: "No group" }),
      ),
    ).toBe(true);
  });

  it("blocks payments", () => {
    expect(isExpenseMutable(expense({ payment: true }))).toBe(false);
  });

  it("blocks expenses without group or friendship", () => {
    expect(isExpenseMutable(expense({ groupId: 0 }))).toBe(false);
    expect(isExpenseMutable(expense({ groupId: null }))).toBe(false);
  });
});
