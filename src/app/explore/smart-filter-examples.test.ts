import { describe, expect, it } from "vitest";
import { buildSmartFilterExamples } from "@/app/explore/smart-filter-examples";

describe("buildSmartFilterExamples", () => {
  it("uses the user's top group, category, and friend", () => {
    const examples = buildSmartFilterExamples({
      groups: [{ groupName: "Apartment" }],
      topCategories: [{ categoryName: "Groceries" }],
      friends: [{ name: "Alex" }],
    });
    expect(examples).toEqual([
      "Apartment this month",
      "Groceries last 30 days",
      "How much with Alex this year?",
    ]);
  });

  it("falls back when catalog is empty", () => {
    expect(
      buildSmartFilterExamples({
        groups: [],
        topCategories: [],
        friends: [],
      }),
    ).toEqual(["This month", "Last 30 days", "Settlements"]);
  });
});
