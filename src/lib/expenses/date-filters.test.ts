import { describe, expect, it } from "vitest";
import {
  expenseDateFromIso,
  expenseDateInputValue,
  expenseDateToIso,
  formatExpenseDateRangeLabel,
} from "@/lib/expenses/date-filters";

describe("expense date filters", () => {
  it("round-trips local calendar days through ISO", () => {
    const local = "2026-06-06";
    const from = expenseDateFromIso(local)!;
    const to = expenseDateToIso(local)!;

    expect(expenseDateInputValue(from)).toBe(local);
    expect(expenseDateInputValue(to)).toBe(local);
    expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
  });

  it("formats chip labels with local dates", () => {
    const from = expenseDateFromIso("2026-01-15")!;
    const to = expenseDateToIso("2026-03-01")!;
    expect(formatExpenseDateRangeLabel(from, to)).toBe(
      "2026-01-15 – 2026-03-01",
    );
  });

  it("rejects invalid local date strings", () => {
    expect(expenseDateFromIso("2026-13-40")).toBeUndefined();
    expect(expenseDateToIso("not-a-date")).toBeUndefined();
  });
});
