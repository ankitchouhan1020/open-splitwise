import { describe, expect, it } from "vitest";
import {
  normalizeStructuredJson,
  narrativeResponseJsonSchema,
  parseFiltersResponseJsonSchema,
} from "@/lib/ai/json-schema";
import {
  narrativeAiResponseSchema,
  parseFiltersResponseSchema,
} from "@/lib/ai/response-schemas";

describe("json-schema", () => {
  it("builds strict parse-filters schema with nullable optional fields", () => {
    expect(parseFiltersResponseJsonSchema.additionalProperties).toBe(false);
    expect(parseFiltersResponseJsonSchema.required).toContain("explanation");
    expect(parseFiltersResponseJsonSchema.properties).toHaveProperty("q");
  });

  it("strips null fields before Zod validation", () => {
    const normalized = normalizeStructuredJson({
      q: null,
      explanation: "Food last month",
      costMin: null,
    });

    const result = parseFiltersResponseSchema.zod.safeParse(normalized);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ explanation: "Food last month" });
    }
  });

  it("validates narrative provider payload", () => {
    const normalized = normalizeStructuredJson({
      narrative: "You spent more on dining this month.",
    });
    const result = narrativeAiResponseSchema.zod.safeParse(normalized);
    expect(result.success).toBe(true);
  });

  it("rejects narrative payload missing required fields", () => {
    const result = narrativeAiResponseSchema.zod.safeParse(
      normalizeStructuredJson({ narrative: null }),
    );
    expect(result.success).toBe(false);
  });

  it("pairs response schemas with json schema documents", () => {
    expect(parseFiltersResponseSchema.jsonSchema).toBe(
      parseFiltersResponseJsonSchema,
    );
    expect(narrativeAiResponseSchema.jsonSchema).toBe(
      narrativeResponseJsonSchema,
    );
  });
});
