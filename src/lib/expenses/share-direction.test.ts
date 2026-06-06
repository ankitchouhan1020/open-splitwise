import { describe, expect, it } from "vitest";
import {
  expenseShareDirection,
  matchesShareDirection,
} from "@/lib/expenses/share-direction";

describe("expenseShareDirection", () => {
  it("picks primary payer and payee from shares", () => {
    expect(
      expenseShareDirection([
        { splitwiseUserId: 1, paidShare: "50.00", owedShare: "0.00" },
        { splitwiseUserId: 2, paidShare: "0.00", owedShare: "50.00" },
      ]),
    ).toEqual({ paidByUserId: 1, paidToUserId: 2 });
  });
});

describe("matchesShareDirection", () => {
  it("requires both payer and payee when set", () => {
    expect(
      matchesShareDirection(
        { paidByUserId: 1, paidToUserId: 2 },
        { paidByUserId: 1, paidToUserId: 2 },
      ),
    ).toBe(true);
    expect(
      matchesShareDirection(
        { paidByUserId: 1, paidToUserId: 2 },
        { paidByUserId: 1, paidToUserId: 3 },
      ),
    ).toBe(false);
  });
});
