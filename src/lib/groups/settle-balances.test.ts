import { describe, expect, it } from "vitest";
import { computeGroupSettleBalances } from "@/lib/groups/settle-balances";

const OWNER = 1;

describe("computeGroupSettleBalances", () => {
  it("computes who owes the owner in a group", () => {
    const names = new Map([
      [2, "Jordan"],
      [3, "Sam"],
    ]);
    const { toGet, toPay } = computeGroupSettleBalances(
      OWNER,
      [
        {
          activityAt: "2026-01-01T00:00:00.000Z",
          shares: [
            {
              splitwiseUserId: OWNER,
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
          ],
        },
      ],
      names,
    );

    expect(toGet).toEqual([
      {
        userId: 2,
        name: "Jordan",
        direction: "to_get",
        amount: 10,
        expenseCount: 1,
        lastActivityAt: "2026-01-01T00:00:00.000Z",
      },
      {
        userId: 3,
        name: "Sam",
        direction: "to_get",
        amount: 10,
        expenseCount: 1,
        lastActivityAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    expect(toPay).toEqual([]);
  });

  it("computes who the owner owes in a group", () => {
    const names = new Map([[2, "Jordan"]]);
    const { toGet, toPay } = computeGroupSettleBalances(
      OWNER,
      [
        {
          activityAt: "2026-01-02T00:00:00.000Z",
          shares: [
            {
              splitwiseUserId: 2,
              paidShare: "40.00",
              owedShare: "20.00",
            },
            {
              splitwiseUserId: OWNER,
              paidShare: "0.00",
              owedShare: "20.00",
            },
          ],
        },
      ],
      names,
    );

    expect(toGet).toEqual([]);
    expect(toPay).toEqual([
      {
        userId: 2,
        name: "Jordan",
        direction: "to_pay",
        amount: 20,
        expenseCount: 1,
        lastActivityAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
  });

  it("reduces balance after a settlement payment", () => {
    const names = new Map([[2, "Jordan"]]);
    const { toGet } = computeGroupSettleBalances(
      OWNER,
      [
        {
          activityAt: "2026-01-01T00:00:00.000Z",
          shares: [
            {
              splitwiseUserId: OWNER,
              paidShare: "20.00",
              owedShare: "0.00",
            },
            {
              splitwiseUserId: 2,
              paidShare: "0.00",
              owedShare: "20.00",
            },
          ],
        },
        {
          activityAt: "2026-01-03T00:00:00.000Z",
          shares: [
            {
              splitwiseUserId: 2,
              paidShare: "20.00",
              owedShare: "0.00",
            },
            {
              splitwiseUserId: OWNER,
              paidShare: "0.00",
              owedShare: "20.00",
            },
          ],
        },
      ],
      names,
    );

    expect(toGet).toEqual([]);
  });
});
