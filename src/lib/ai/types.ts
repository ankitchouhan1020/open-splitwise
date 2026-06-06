import type { AiProvider } from "@/lib/ai/providers";

export type { AiProvider };

export type AiSettingsPublic = {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string | null;
  model: string;
  hasKey: boolean;
  /** Masked hint for the saved key, e.g. sk-or-…4f2a. Null when no key. */
  keyPreview: string | null;
};

export type AiSettingsRecord = AiSettingsPublic & {
  encryptedApiKey: string | null;
};

export type AiClientConfig = {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export class AiError extends Error {
  constructor(
    message: string,
    readonly code:
      | "ai_disabled"
      | "ai_misconfigured"
      | "ai_provider_error"
      | "ai_parse_error",
  ) {
    super(message);
    this.name = "AiError";
  }
}
