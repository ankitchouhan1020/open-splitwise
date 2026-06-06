/** Helpers for provider-native JSON Schema (OpenAI strict, Gemini, Claude). */

type JsonSchemaObject = Record<string, unknown>;

/** Object schema with all keys required; unused fields should be returned as null. */
export function strictObjectSchema(
  properties: Record<string, JsonSchemaObject>,
  required: string[],
): JsonSchemaObject {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

/** Parser output — omit fields that do not apply. */
export function optionalObjectSchema(
  properties: Record<string, JsonSchemaObject>,
): JsonSchemaObject {
  return {
    type: "object",
    properties,
    additionalProperties: false,
  };
}

export const parseFiltersResponseJsonSchema = optionalObjectSchema({
  q: { type: "string" },
  dateFrom: { type: "string" },
  dateTo: { type: "string" },
  groupName: { type: "string" },
  friendName: { type: "string" },
  paidByName: { type: "string" },
  paidToName: { type: "string" },
  categoryName: { type: "string" },
  currency: { type: "string" },
  payment: { type: "boolean" },
  costMin: { type: "number" },
  costMax: { type: "number" },
  shareMin: { type: "number" },
  shareMax: { type: "number" },
  sort: {
    type: "string",
    enum: ["date", "expenseDate", "cost", "description"],
  },
  order: { type: "string", enum: ["asc", "desc"] },
});

export const narrativeResponseJsonSchema = strictObjectSchema(
  {
    narrative: { type: "string" },
  },
  ["narrative"],
);

/** Drop null/undefined entries from provider payloads before Zod validation. */
export function normalizeStructuredJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(normalizeStructuredJson);
  }
  if (typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, normalizeStructuredJson(v)]),
  );
}
