import { describe, expect, it } from "vitest";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";

describe("isUserInvolvedInExpense", () => {
  it("is false when no share row exists", () => {
    expect(isUserInvolvedInExpense({ myShare: null, myPaidShare: null })).toBe(
      false,
    );
  });

  it("is true when user has an owed share", () => {
    expect(
      isUserInvolvedInExpense({ myShare: "10.00", myPaidShare: null }),
    ).toBe(true);
  });

  it("is true when user only paid (owed is zero)", () => {
    expect(
      isUserInvolvedInExpense({ myShare: "0.00", myPaidShare: "50.00" }),
    ).toBe(true);
  });
});
