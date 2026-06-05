import { describe, expect, it } from "vitest";
import { describeSplitFromShares } from "@/lib/expenses/split-summary";

describe("describeSplitFromShares", () => {
  it("detects equal splits", () => {
    const result = describeSplitFromShares([
      { paidShare: "30.00", owedShare: "10.00" },
      { paidShare: "0.00", owedShare: "10.00" },
      { paidShare: "0.00", owedShare: "10.00" },
    ]);
    expect(result.mode).toBe("equal");
    expect(result.headline).toContain("Equal");
    expect(result.payerCount).toBe(1);
  });

  it("detects unequal splits", () => {
    const result = describeSplitFromShares([
      { paidShare: "50.00", owedShare: "35.00" },
      { paidShare: "0.00", owedShare: "15.00" },
    ]);
    expect(result.mode).toBe("unequal");
    expect(result.headline).toContain("Custom");
  });

  it("notes multiple payers", () => {
    const result = describeSplitFromShares([
      { paidShare: "20.00", owedShare: "10.00" },
      { paidShare: "10.00", owedShare: "10.00" },
    ]);
    expect(result.detail).toContain("2 people paid");
  });
});
