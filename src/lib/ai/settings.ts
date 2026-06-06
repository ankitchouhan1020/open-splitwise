import "server-only";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  decryptApiKey,
  encryptApiKey,
  formatApiKeyPreview,
} from "@/lib/ai/crypto";
import {
  DEFAULT_AI_PROVIDER,
  defaultModelForProvider,
  parseAiProvider,
} from "@/lib/ai/providers";
import type {
  AiProvider,
  AiSettingsPublic,
  AiSettingsRecord,
} from "@/lib/ai/types";

function keyPreviewFromStored(encryptedApiKey: string | null): string | null {
  if (!encryptedApiKey) return null;
  try {
    return formatApiKeyPreview(decryptApiKey(encryptedApiKey));
  } catch {
    return null;
  }
}

function resolveStoredModel(
  provider: AiProvider,
  model: string | null | undefined,
): string {
  const trimmed = model?.trim();
  return trimmed || defaultModelForProvider(provider);
}

function toPublic(row: {
  enabled: boolean;
  provider: string;
  baseUrl: string | null;
  model: string | null;
  encryptedApiKey: string | null;
}): AiSettingsPublic {
  const provider = parseAiProvider(row.provider);
  return {
    enabled: row.enabled,
    provider,
    baseUrl: row.baseUrl,
    model: resolveStoredModel(provider, row.model),
    hasKey: Boolean(row.encryptedApiKey),
    keyPreview: keyPreviewFromStored(row.encryptedApiKey),
  };
}

export async function getAiSettingsForAccount(
  accountUserId: number,
): Promise<AiSettingsPublic> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.userAiSettings)
    .where(eq(schema.userAiSettings.accountUserId, accountUserId))
    .limit(1);

  if (!row) {
    return {
      enabled: false,
      provider: DEFAULT_AI_PROVIDER,
      baseUrl: null,
      model: defaultModelForProvider(DEFAULT_AI_PROVIDER),
      hasKey: false,
      keyPreview: null,
    };
  }

  return toPublic(row);
}

export async function getAiSettingsRecord(
  accountUserId: number,
): Promise<AiSettingsRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.userAiSettings)
    .where(eq(schema.userAiSettings.accountUserId, accountUserId))
    .limit(1);

  if (!row) return null;

  return {
    ...toPublic(row),
    encryptedApiKey: row.encryptedApiKey,
  };
}

export type UpsertAiSettingsInput = {
  enabled?: boolean;
  provider?: AiProvider;
  baseUrl?: string | null;
  model?: string;
  apiKey?: string;
  clearApiKey?: boolean;
};

export async function upsertAiSettings(
  accountUserId: number,
  input: UpsertAiSettingsInput,
): Promise<AiSettingsPublic> {
  const db = getDb();
  const existing = await getAiSettingsRecord(accountUserId);

  let enabled = input.enabled ?? existing?.enabled ?? false;
  const provider = input.provider ?? existing?.provider ?? DEFAULT_AI_PROVIDER;
  const baseUrl =
    input.baseUrl !== undefined ? input.baseUrl : (existing?.baseUrl ?? null);
  const providerChanged =
    existing &&
    input.provider !== undefined &&
    input.provider !== existing.provider;

  let model =
    input.model?.trim() ||
    (providerChanged
      ? defaultModelForProvider(provider)
      : existing?.model || defaultModelForProvider(provider));

  let encryptedApiKey = existing?.encryptedApiKey ?? null;
  if (input.clearApiKey) {
    encryptedApiKey = null;
    enabled = false;
  } else if (input.apiKey !== undefined) {
    const trimmed = input.apiKey.trim();
    encryptedApiKey = trimmed ? encryptApiKey(trimmed) : null;
    if (!trimmed) enabled = false;
  } else if (providerChanged) {
    encryptedApiKey = null;
    enabled = false;
    model = defaultModelForProvider(provider);
  }

  if (existing) {
    const [updated] = await db
      .update(schema.userAiSettings)
      .set({
        enabled,
        provider,
        baseUrl: baseUrl || null,
        model,
        encryptedApiKey,
        updatedAt: new Date(),
      })
      .where(eq(schema.userAiSettings.accountUserId, accountUserId))
      .returning();
    return toPublic(updated!);
  }

  const [created] = await db
    .insert(schema.userAiSettings)
    .values({
      accountUserId,
      enabled,
      provider,
      baseUrl: baseUrl || null,
      model,
      encryptedApiKey,
    })
    .returning();

  return toPublic(created!);
}

/** Resolve API key for model listing: draft key or saved key for matching provider. */
export function resolveModelsListCredentials(input: {
  provider: AiProvider;
  baseUrl: string | null;
  draftApiKey?: string;
  record: AiSettingsRecord | null;
}): { apiKey: string } | { error: "ai_key_required" | "ai_base_url_required" } {
  const draft = input.draftApiKey?.trim();
  if (draft) return { apiKey: draft };

  if (
    !input.record?.encryptedApiKey ||
    input.record.provider !== input.provider
  ) {
    return { error: "ai_key_required" };
  }

  if (input.provider === "custom" && !input.baseUrl?.trim()) {
    return { error: "ai_base_url_required" };
  }

  try {
    return { apiKey: decryptApiKey(input.record.encryptedApiKey) };
  } catch {
    return { error: "ai_key_required" };
  }
}
