import { describe, expect, it } from "vitest";
import {
  buildEqualSplitUsersBody,
  canUseSplitEqually,
  equalOwedShares,
  formatCostAmount,
} from "@/lib/expenses/splits";

describe("formatCostAmount", () => {
  it("normalizes to two decimals", () => {
    expect(formatCostAmount("25")).toBe("25.00");
    expect(formatCostAmount("25.5")).toBe("25.50");
  });
});

describe("equalOwedShares", () => {
  it("splits evenly when divisible", () => {
    expect(equalOwedShares("30.00", 3)).toEqual(["10.00", "10.00", "10.00"]);
  });

  it("distributes remainder cents to earlier shares", () => {
    expect(equalOwedShares("10.00", 3)).toEqual(["3.34", "3.33", "3.33"]);
  });
});

describe("buildEqualSplitUsersBody", () => {
  it("assigns full payment to payer and equal owed shares", () => {
    expect(buildEqualSplitUsersBody(1, [1, 2, 3], "30.00")).toEqual({
      users__0__user_id: 1,
      users__0__paid_share: "30.00",
      users__0__owed_share: "10.00",
      users__1__user_id: 2,
      users__1__paid_share: "0.00",
      users__1__owed_share: "10.00",
      users__2__user_id: 3,
      users__2__paid_share: "0.00",
      users__2__owed_share: "10.00",
    });
  });

  it("deduplicates participant ids", () => {
    const body = buildEqualSplitUsersBody(5, [5, 5, 7], "20.00");
    expect(body.users__0__user_id).toBe(5);
    expect(body.users__1__user_id).toBe(7);
  });

  it("allows payer who is not in the split", () => {
    expect(buildEqualSplitUsersBody(99, [1, 2], "10.00")).toEqual({
      users__0__user_id: 99,
      users__0__paid_share: "10.00",
      users__0__owed_share: "0.00",
      users__1__user_id: 1,
      users__1__paid_share: "0.00",
      users__1__owed_share: "5.00",
      users__2__user_id: 2,
      users__2__paid_share: "0.00",
      users__2__owed_share: "5.00",
    });
  });
});

describe("canUseSplitEqually", () => {
  it("is true when all members selected and current user paid", () => {
    expect(canUseSplitEqually([1, 2, 3], [1, 2, 3], 1, 1)).toBe(true);
  });

  it("is false when subset selected", () => {
    expect(canUseSplitEqually([1, 2, 3], [1, 2], 1, 1)).toBe(false);
  });

  it("is false when someone else paid", () => {
    expect(canUseSplitEqually([1, 2, 3], [1, 2, 3], 2, 1)).toBe(false);
  });
});
