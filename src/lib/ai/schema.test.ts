import { describe, expect, it } from "vitest";
import { AI_PROVIDERS } from "@/lib/ai/providers";
import {
  parsedFilterDraftSchema,
  parseFiltersRequestSchema,
  upsertAiSettingsBodySchema,
} from "@/lib/ai/schema";

describe("ai schema", () => {
  it("accepts valid parse filter draft", () => {
    const result = parsedFilterDraftSchema.safeParse({
      q: "uber",
      dateFrom: "2025-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty parse filter draft", () => {
    const result = parsedFilterDraftSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates parse-filters request", () => {
    expect(
      parseFiltersRequestSchema.safeParse({ query: "  food  " }).success,
    ).toBe(true);
    expect(parseFiltersRequestSchema.safeParse({ query: "" }).success).toBe(
      false,
    );
  });

  it("validates settings body for all configured providers", () => {
    for (const provider of Object.keys(AI_PROVIDERS)) {
      const result = upsertAiSettingsBodySchema.safeParse({
        enabled: true,
        provider,
        apiKey: "key",
      });
      expect(result.success).toBe(true);
    }
  });
});
