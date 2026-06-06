/** Helpers for provider-native JSON Schema (OpenAI strict, Gemini, Claude). */

type JsonSchemaObject = Record<string, unknown>;

function nullable(type: string | string[]): JsonSchemaObject {
  const types = Array.isArray(type) ? type : [type];
  return { type: [...types, "null"] };
}

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

export const parseFiltersResponseJsonSchema = strictObjectSchema(
  {
    q: nullable("string"),
    dateFrom: nullable("string"),
    dateTo: nullable("string"),
    groupName: nullable("string"),
    friendName: nullable("string"),
    paidByName: nullable("string"),
    paidToName: nullable("string"),
    categoryName: nullable("string"),
    currency: nullable("string"),
    payment: nullable("boolean"),
    costMin: nullable("number"),
    costMax: nullable("number"),
    shareMin: nullable("number"),
    shareMax: nullable("number"),
    sort: {
      type: ["string", "null"],
      enum: ["date", "cost", "description", null],
    },
    order: {
      type: ["string", "null"],
      enum: ["asc", "desc", null],
    },
    explanation: { type: "string" },
  },
  [
    "q",
    "dateFrom",
    "dateTo",
    "groupName",
    "friendName",
    "paidByName",
    "paidToName",
    "categoryName",
    "currency",
    "payment",
    "costMin",
    "costMax",
    "shareMin",
    "shareMax",
    "sort",
    "order",
    "explanation",
  ],
);

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
