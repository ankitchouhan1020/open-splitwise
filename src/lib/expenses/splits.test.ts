import { describe, expect, it } from "vitest";
import {
  buildCustomSplitUsersBody,
  buildEqualSplitUsersBody,
  buildSettlementUsersBody,
  canUseSplitEqually,
  equalOwedShares,
  formatCostAmount,
  parseExpenseSplitState,
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

describe("parseExpenseSplitState", () => {
  it("derives payer and participants from shares", () => {
    expect(
      parseExpenseSplitState([
        {
          splitwiseUserId: 1,
          paidShare: "30.00",
          owedShare: "10.00",
        },
        {
          splitwiseUserId: 2,
          paidShare: "0.00",
          owedShare: "10.00",
        },
        {
          splitwiseUserId: 3,
          paidShare: "0.00",
          owedShare: "10.00",
        },
      ]),
    ).toEqual({
      paidByUserId: 1,
      participantIds: [1, 2, 3],
    });
  });

  it("excludes payer from participants when they did not owe", () => {
    expect(
      parseExpenseSplitState([
        {
          splitwiseUserId: 9,
          paidShare: "20.00",
          owedShare: "0.00",
        },
        {
          splitwiseUserId: 2,
          paidShare: "0.00",
          owedShare: "10.00",
        },
        {
          splitwiseUserId: 3,
          paidShare: "0.00",
          owedShare: "10.00",
        },
      ]),
    ).toEqual({
      paidByUserId: 9,
      participantIds: [2, 3],
    });
  });
});

describe("buildSettlementUsersBody", () => {
  it("assigns full payment to payer and payee owed share", () => {
    expect(buildSettlementUsersBody(1, 2, "25.00")).toEqual({
      users__0__user_id: 1,
      users__0__paid_share: "25.00",
      users__0__owed_share: "0.00",
      users__1__user_id: 2,
      users__1__paid_share: "0.00",
      users__1__owed_share: "25.00",
    });
  });
});

describe("buildCustomSplitUsersBody", () => {
  it("supports exact owed amounts", () => {
    expect(
      buildCustomSplitUsersBody(1, [1, 2], "30.00", "exact", [
        { userId: 1, value: "10.00" },
        { userId: 2, value: "20.00" },
      ]),
    ).toEqual({
      users__0__user_id: 1,
      users__0__paid_share: "30.00",
      users__0__owed_share: "10.00",
      users__1__user_id: 2,
      users__1__paid_share: "0.00",
      users__1__owed_share: "20.00",
    });
  });

  it("supports percentage splits", () => {
    const body = buildCustomSplitUsersBody(5, [5, 6, 7], "10.00", "percent", [
      { userId: 5, value: "50" },
      { userId: 6, value: "30" },
      { userId: 7, value: "20" },
    ]);
    expect(body.users__0__owed_share).toBe("5.00");
    expect(body.users__1__owed_share).toBe("3.00");
    expect(body.users__2__owed_share).toBe("2.00");
  });

  it("rejects exact splits that do not add up", () => {
    expect(() =>
      buildCustomSplitUsersBody(1, [1, 2], "10.00", "exact", [
        { userId: 1, value: "4.00" },
        { userId: 2, value: "4.00" },
      ]),
    ).toThrow("split_total_mismatch");
  });
});
