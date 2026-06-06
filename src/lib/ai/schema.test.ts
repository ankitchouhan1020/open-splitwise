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
      explanation: "Uber rides in January",
    });
    expect(result.success).toBe(true);
  });

  it("rejects draft without explanation", () => {
    const result = parsedFilterDraftSchema.safeParse({ q: "uber" });
    expect(result.success).toBe(false);
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
