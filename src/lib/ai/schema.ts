import { z } from "zod";
import { aiProviderIdSchema } from "@/lib/ai/providers";

export {
  narrativeAiResponseSchema,
  narrativeResponseSchema,
  parseFiltersResponseSchema,
  parsedFilterDraftSchema,
  type AiResponseSchema,
  type NarrativeResponse,
  type ParsedFilterDraft,
} from "@/lib/ai/response-schemas";

export const parseFiltersRequestSchema = z.object({
  query: z.string().trim().min(1).max(500),
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
