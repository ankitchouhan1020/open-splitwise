import providersFile from "../../../config/ai-providers.json";
import type {
  AiProviderDefinition,
  AiProviderApi,
} from "@/lib/ai/provider-types";
import { z } from "zod";

const providerDefinitionSchema = z.object({
  label: z.string().min(1),
  defaultBaseUrl: z.string().nullable(),
  defaultModel: z.string().min(1),
  api: z.enum(["openai-chat", "claude", "gemini"]),
  keyHint: z.string().min(1),
});

const providersFileSchema = z.object({
  defaultProvider: z.string().min(1),
  providers: z
    .record(z.string(), providerDefinitionSchema)
    .refine(
      (providers) => Object.keys(providers).length > 0,
      "At least one AI provider must be configured",
    ),
});

const parsed = providersFileSchema.parse(providersFile);

export const DEFAULT_AI_PROVIDER = parsed.defaultProvider;
export const AI_PROVIDERS = parsed.providers;

const providerIds = Object.keys(AI_PROVIDERS);
if (!providerIds.includes(DEFAULT_AI_PROVIDER)) {
  throw new Error(
    `config/ai-providers.json: defaultProvider "${DEFAULT_AI_PROVIDER}" is not defined in providers`,
  );
}

export const AI_PROVIDER_IDS = providerIds as [string, ...string[]];
export type AiProvider = (typeof AI_PROVIDER_IDS)[number];

export const aiProviderIdSchema = z.enum(AI_PROVIDER_IDS);

export type { AiProviderApi, AiProviderDefinition };

export function parseAiProvider(value: string): AiProvider {
  if (AI_PROVIDER_IDS.includes(value)) {
    return value as AiProvider;
  }
  return DEFAULT_AI_PROVIDER as AiProvider;
}

export function getProviderDefinition(
  provider: AiProvider,
): AiProviderDefinition {
  const def = AI_PROVIDERS[provider];
  if (!def) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }
  return def;
}

export function getProviderApi(provider: AiProvider): AiProviderApi {
  return getProviderDefinition(provider).api;
}

export function resolveProviderBaseUrl(
  provider: AiProvider,
  baseUrl: string | null | undefined,
): string {
  if (provider === "custom") {
    if (!baseUrl?.trim()) {
      throw new Error("Custom provider requires a base URL");
    }
    return baseUrl.trim().replace(/\/$/, "");
  }

  const def = getProviderDefinition(provider);
  if (def.defaultBaseUrl) return def.defaultBaseUrl;
  throw new Error(`Provider ${provider} has no default base URL`);
}

export function defaultModelForProvider(provider: AiProvider): string {
  return getProviderDefinition(provider).defaultModel;
}
