import { describe, expect, it } from "vitest";
import {
  activeGroupDebts,
  ownerNetFromGroupMembers,
  ownerSettleEntriesFromDebts,
  parseSplitwiseDebts,
} from "@/lib/groups/debt-model";

describe("activeGroupDebts", () => {
  it("prefers simplified debts when simplify is enabled", () => {
    expect(
      activeGroupDebts({
        simplifyByDefault: true,
        originalDebts: [
          { from: 1, to: 2, amount: "10.00", currency_code: "USD" },
        ],
        simplifiedDebts: [
          { from: 1, to: 3, amount: "10.00", currency_code: "USD" },
        ],
      }),
    ).toEqual([{ from: 1, to: 3, amount: "10.00", currency_code: "USD" }]);
  });
});

describe("ownerSettleEntriesFromDebts", () => {
  it("maps debts involving the owner", () => {
    const entries = ownerSettleEntriesFromDebts(
      1,
      parseSplitwiseDebts([
        { from: 2, to: 1, amount: "15.00", currency_code: "INR" },
        { from: 1, to: 3, amount: "5.00", currency_code: "INR" },
      ]),
      "INR",
    );

    expect(entries).toEqual([
      {
        userId: 2,
        direction: "to_get",
        amount: 15,
        currencyCode: "INR",
      },
      {
        userId: 3,
        direction: "to_pay",
        amount: 5,
        currencyCode: "INR",
      },
    ]);
  });
});

describe("ownerNetFromGroupMembers", () => {
  it("reads the owner balance in the requested currency", () => {
    expect(
      ownerNetFromGroupMembers(
        [
          {
            id: 1,
            first_name: "Alex",
            last_name: "Morgan",
            email: "alex@example.com",
            balance: [{ currency_code: "INR", amount: "11011.31" }],
          },
        ],
        1,
        "INR",
      ),
    ).toBe(11011.31);
  });
});
