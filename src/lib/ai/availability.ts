import "server-only";

import { decryptApiKey } from "@/lib/ai/crypto";
import {
  defaultModelForProvider,
  parseAiProvider,
  resolveProviderBaseUrl,
} from "@/lib/ai/providers";
import { getAiSettingsRecord } from "@/lib/ai/settings";
import type { AiClientConfig } from "@/lib/ai/types";
import type { AiSettingsRecord } from "@/lib/ai/types";
import { AiError } from "@/lib/ai/types";

/** Shared gate: enabled, decryptable key, and resolvable provider endpoint. */
export function isAiSettingsRecordReady(
  record: AiSettingsRecord | null,
): boolean {
  if (!record?.enabled || !record.encryptedApiKey) return false;

  try {
    decryptApiKey(record.encryptedApiKey);
    resolveProviderBaseUrl(parseAiProvider(record.provider), record.baseUrl);
    return true;
  } catch {
    return false;
  }
}

export async function isAiAvailable(accountUserId: number): Promise<boolean> {
  const record = await getAiSettingsRecord(accountUserId);
  return isAiSettingsRecordReady(record);
}

export type AiEnablementValidation =
  | { ok: true }
  | { ok: false; error: "ai_key_required" | "ai_base_url_required" };

/** Validates that an enabled configuration can actually call a provider. */
export function validateAiEnablement(input: {
  enabled: boolean;
  provider: AiSettingsRecord["provider"];
  baseUrl: string | null;
  hasEncryptedKey: boolean;
}): AiEnablementValidation {
  if (!input.enabled) return { ok: true };
  if (!input.hasEncryptedKey) return { ok: false, error: "ai_key_required" };

  if (input.provider === "custom" && !input.baseUrl?.trim()) {
    return { ok: false, error: "ai_base_url_required" };
  }

  try {
    resolveProviderBaseUrl(input.provider, input.baseUrl);
  } catch {
    return { ok: false, error: "ai_base_url_required" };
  }

  return { ok: true };
}

export async function getAiClientConfig(
  accountUserId: number,
): Promise<AiClientConfig> {
  const record = await getAiSettingsRecord(accountUserId);
  if (!isAiSettingsRecordReady(record)) {
    throw new AiError("AI features are disabled", "ai_disabled");
  }

  const apiKey = decryptApiKey(record!.encryptedApiKey!);
  const provider = parseAiProvider(record!.provider);
  const baseUrl = resolveProviderBaseUrl(provider, record!.baseUrl);
  const model = record!.model || defaultModelForProvider(provider);

  return {
    provider,
    baseUrl,
    model,
    apiKey,
  };
}
