import { describe, expect, it } from "vitest";
import {
  buildParseFiltersPrompt,
  buildNarrativePrompt,
} from "@/lib/ai/prompts";

describe("buildParseFiltersPrompt", () => {
  it("omits catalog and only includes hints when provided", () => {
    const { system, user } = buildParseFiltersPrompt({
      query: "Roommates last month",
      today: "2026-06-06",
      ownerName: "Ankit",
      hints: { groups: ["Roommates"] },
    });

    expect(system).toContain("2026-06-06");
    expect(system).not.toContain("Catalog");
    expect(user).toBe(
      '"Roommates last month"\nHints: {"groups":["Roommates"]}',
    );
  });

  it("sends only the query when there are no hints", () => {
    const { user } = buildParseFiltersPrompt({
      query: "last 30 days",
      today: "2026-06-06",
    });

    expect(user).toBe('"last 30 days"');
  });
});

describe("buildNarrativePrompt", () => {
  it("keeps the system prompt focused on synthesizing facts", () => {
    const { system } = buildNarrativePrompt({
      today: "2026-06-06",
      currency: "USD",
      facts: ["Groceries is up 40% vs last month."],
    });

    expect(system).toContain("NOT to paraphrase those cards");
    expect(system.length).toBeLessThan(700);
  });
});
