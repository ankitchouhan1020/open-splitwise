import { z } from "zod";
import {
  narrativeResponseJsonSchema,
  parseFiltersResponseJsonSchema,
} from "@/lib/ai/json-schema";

/** Raw LLM output before name→id resolution. */
export const parsedFilterDraftSchema = z.object({
  q: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  groupName: z.string().optional(),
  friendName: z.string().optional(),
  paidByName: z.string().optional(),
  paidToName: z.string().optional(),
  categoryName: z.string().optional(),
  currency: z.string().optional(),
  payment: z.boolean().optional(),
  costMin: z.number().optional(),
  costMax: z.number().optional(),
  shareMin: z.number().optional(),
  shareMax: z.number().optional(),
  sort: z.enum(["date", "expenseDate", "cost", "description"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ParsedFilterDraft = z.infer<typeof parsedFilterDraftSchema>;

export const narrativeResponseSchema = z.object({
  narrative: z.string().min(1).max(800),
});

export type NarrativeResponse = z.infer<typeof narrativeResponseSchema>;

export type AiResponseSchema<T extends z.ZodType = z.ZodType> = {
  /** Stable name sent to providers (OpenAI json_schema.name, etc.). */
  name: string;
  zod: T;
  jsonSchema: Record<string, unknown>;
  /** OpenAI strict mode; false for sparse parser output. */
  strict?: boolean;
};

export const parseFiltersResponseSchema = {
  name: "parse_filters_response",
  zod: parsedFilterDraftSchema,
  jsonSchema: parseFiltersResponseJsonSchema,
  strict: false,
} satisfies AiResponseSchema<typeof parsedFilterDraftSchema>;

export const narrativeAiResponseSchema = {
  name: "narrative_response",
  zod: narrativeResponseSchema,
  jsonSchema: narrativeResponseJsonSchema,
} satisfies AiResponseSchema<typeof narrativeResponseSchema>;
