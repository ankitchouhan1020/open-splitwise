import { z } from "zod";
import { aiProviderIdSchema } from "@/lib/ai/providers";

export {
  narrativeAiResponseSchema,
  narrativeResponseSchema,
  parseFiltersResponseSchema,
  parsedFilterDraftSchema,
  suggestCategoriesAiResponseSchema,
  suggestCategoriesResponseSchema,
  type AiResponseSchema,
  type NarrativeResponse,
  type ParsedFilterDraft,
  type SuggestCategoriesResponse,
} from "@/lib/ai/response-schemas";

export const parseFiltersRequestSchema = z.object({
  query: z.string().trim().min(1).max(500),
});

export const suggestCategoriesRequestSchema = z.object({
  expenses: z
    .array(
      z.object({
        id: z.number().int().positive(),
        description: z.string().trim().min(1).max(500),
        details: z.string().max(2000).nullable().optional(),
        categoryId: z.number().int().positive().nullable().optional(),
        categoryName: z.string().max(200).nullable().optional(),
      }),
    )
    .min(1)
    .max(30),
});

export const upsertAiSettingsBodySchema = z.object({
  enabled: z.boolean().optional(),
  provider: aiProviderIdSchema.optional(),
  baseUrl: z.string().trim().max(500).nullable().optional(),
  model: z.string().trim().min(1).max(100).optional(),
  apiKey: z.string().optional(),
  clearApiKey: z.boolean().optional(),
});

export const listAiModelsBodySchema = z.object({
  provider: aiProviderIdSchema,
  baseUrl: z.string().trim().max(500).nullable().optional(),
  apiKey: z.string().optional(),
});
