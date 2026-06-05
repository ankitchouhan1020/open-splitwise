import { describe, expect, it } from "vitest";
import { parseBulkExpenseText } from "./bulk-parse";

describe("parseBulkExpenseText", () => {
  it("parses comma-separated lines", () => {
    const { rows, errors } = parseBulkExpenseText(
      "Groceries, 45.20\nUber, 12.5",
    );
    expect(errors).toHaveLength(0);
    expect(rows).toEqual([
      { lineNumber: 1, description: "Groceries", cost: "45.2" },
      { lineNumber: 2, description: "Uber", cost: "12.5" },
    ]);
  });

  it("parses tab-separated paste", () => {
    const { rows } = parseBulkExpenseText("Dinner\t89.00\n12.50\tCoffee");
    expect(rows).toEqual([
      { lineNumber: 1, description: "Dinner", cost: "89" },
      { lineNumber: 2, description: "Coffee", cost: "12.5" },
    ]);
  });

  it("parses amount-first and amount-last formats", () => {
    const { rows } = parseBulkExpenseText("25 Lunch\nDinner 40");
    expect(rows).toEqual([
      { lineNumber: 1, description: "Lunch", cost: "25" },
      { lineNumber: 2, description: "Dinner", cost: "40" },
    ]);
  });

  it("skips blank lines and comments", () => {
    const { rows } = parseBulkExpenseText("# trip\n\nTaxi, 10");
    expect(rows).toHaveLength(1);
  });

  it("reports invalid lines", () => {
    const { rows, errors } = parseBulkExpenseText("no amount here");
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].lineNumber).toBe(1);
  });
});
