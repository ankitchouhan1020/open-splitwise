import { describe, expect, it } from "vitest";
import {
  balanceOverallHeading,
  balanceRowSubline,
  balanceRowTitle,
  groupSettledSectionHeading,
  groupUnsettledSectionHeading,
  personBalanceRowTitle,
  summarizeGroupNetBalances,
} from "@/lib/balance-row-copy";

describe("balanceRowTitle", () => {
  it("formats owed and owe headlines", () => {
    expect(balanceRowTitle("you_are_owed", 50, "USD")).toBe(
      "You're owed $50.00",
    );
    expect(balanceRowTitle("you_owe", 30, "USD")).toBe("You owe $30.00");
  });
});

describe("personBalanceRowTitle", () => {
  it("includes the person name", () => {
    expect(personBalanceRowTitle("you_are_owed", "Jordan", 10, "USD")).toBe(
      "Jordan owes you $10.00",
    );
    expect(personBalanceRowTitle("you_owe", "Sam", 20, "USD")).toBe(
      "You owe Sam $20.00",
    );
  });
});

describe("balanceRowSubline", () => {
  it("joins non-empty parts", () => {
    expect(balanceRowSubline("Roommates", "8 expenses", null)).toBe(
      "Roommates · 8 expenses",
    );
  });
});

describe("summarizeGroupNetBalances", () => {
  it("totals owed and owe amounts across groups", () => {
    expect(
      summarizeGroupNetBalances([
        { netBalance: "50" },
        { netBalance: "-20" },
        { netBalance: "0.005" },
      ]),
    ).toEqual({ youAreOwed: 50, youOwe: 20 });
  });
});

describe("balanceOverallHeading", () => {
  it("shows net overall instead of separate owed and owe lines", () => {
    expect(balanceOverallHeading(13120, 2108.69, "INR")).toBe(
      "₹11,011.31 to get overall",
    );
    expect(balanceOverallHeading(10, 50, "USD")).toBe("$40.00 to pay overall");
    expect(balanceOverallHeading(100, 100, "USD")).toBe("Even overall");
  });
});

describe("groupUnsettledSectionHeading", () => {
  it("uses the net overall across unsettled groups", () => {
    expect(
      groupUnsettledSectionHeading(
        [{ netBalance: "65.83" }, { netBalance: "-36" }],
        "USD",
      ),
    ).toBe("$29.83 to get overall");
  });
});

describe("groupSettledSectionHeading", () => {
  it("includes settled group count", () => {
    expect(groupSettledSectionHeading(1)).toBe("Settled up · 1 group");
    expect(groupSettledSectionHeading(3)).toBe("Settled up · 3 groups");
  });
});
