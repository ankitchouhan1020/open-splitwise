import "server-only";

import { getProviderApi } from "@/lib/ai/providers";
import type { AiProvider } from "@/lib/ai/types";
import { AiError } from "@/lib/ai/types";

const REQUEST_TIMEOUT_MS = 15_000;
const ANTHROPIC_VERSION = "2023-06-01";

export type AiModelOption = {
  id: string;
  label: string;
};

type ListModelsInput = {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
};

function chatModelIdOpenAi(id: string): boolean {
  const lower = id.toLowerCase();
  if (
    lower.includes("embed") ||
    lower.includes("whisper") ||
    lower.includes("tts") ||
    lower.includes("dall-e") ||
    lower.includes("transcribe") ||
    lower.includes("moderation") ||
    lower.includes("realtime") ||
    lower.includes("audio") ||
    lower.includes("sora")
  ) {
    return false;
  }
  return (
    lower.startsWith("gpt-") ||
    lower.startsWith("o1") ||
    lower.startsWith("o3") ||
    lower.startsWith("o4") ||
    lower.startsWith("chatgpt")
  );
}

function chatModelIdOpenRouter(id: string): boolean {
  const lower = id.toLowerCase();
  if (
    lower.includes("embed") ||
    lower.includes("whisper") ||
    lower.includes("tts") ||
    lower.includes("dall-e") ||
    lower.includes("moderation")
  ) {
    return false;
  }
  return true;
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) {
    throw new AiError(
      body.error?.message ?? `Provider returned ${res.status}`,
      "ai_provider_error",
      res.status,
    );
  }
  return body;
}

async function listOpenAiChatModels(
  input: ListModelsInput,
): Promise<AiModelOption[]> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.apiKey}`,
  };
  if (input.provider === "openrouter") {
    const appUrl =
      process.env.APP_URL?.trim() ??
      process.env.NEXT_PUBLIC_APP_URL?.trim() ??
      "http://localhost:3000";
    headers["HTTP-Referer"] = appUrl;
    headers["X-Title"] = "open-splitwise";
  }

  const body = (await fetchJson(`${input.baseUrl}/models`, { headers })) as {
    data?: Array<{ id?: string }>;
  };

  const filterFn =
    input.provider === "openrouter" ? chatModelIdOpenRouter : chatModelIdOpenAi;

  const ids = (body.data ?? [])
    .map((m) => m.id?.trim())
    .filter((id): id is string => Boolean(id && filterFn(id)));

  return dedupeSorted(ids);
}

async function listGeminiModels(
  input: ListModelsInput,
): Promise<AiModelOption[]> {
  const url = `${input.baseUrl}/models?key=${encodeURIComponent(input.apiKey)}`;
  const body = (await fetchJson(url, {})) as {
    models?: Array<{
      name?: string;
      displayName?: string;
      supportedGenerationMethods?: string[];
    }>;
  };

  const ids = (body.models ?? [])
    .filter((m) =>
      (m.supportedGenerationMethods ?? []).includes("generateContent"),
    )
    .map((m) => {
      const name = m.name ?? "";
      const id = name.startsWith("models/")
        ? name.slice("models/".length)
        : name;
      return { id, label: m.displayName?.trim() || id };
    })
    .filter((m) => m.id.length > 0);

  return dedupeSortedOptions(ids);
}

async function listClaudeModels(
  input: ListModelsInput,
): Promise<AiModelOption[]> {
  const body = (await fetchJson(`${input.baseUrl}/models`, {
    headers: {
      "x-api-key": input.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
  })) as {
    data?: Array<{ id?: string; display_name?: string }>;
  };

  const ids = (body.data ?? [])
    .map((m) => ({
      id: m.id?.trim() ?? "",
      label: m.display_name?.trim() || m.id?.trim() || "",
    }))
    .filter((m) => m.id.length > 0);

  return dedupeSortedOptions(ids);
}

function dedupeSorted(ids: string[]): AiModelOption[] {
  return [...new Set(ids)].sort().map((id) => ({ id, label: id }));
}

function dedupeSortedOptions(items: AiModelOption[]): AiModelOption[] {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function listProviderModels(
  input: ListModelsInput,
): Promise<AiModelOption[]> {
  const api = getProviderApi(input.provider);

  if (api === "gemini") return listGeminiModels(input);
  if (api === "claude") return listClaudeModels(input);
  return listOpenAiChatModels(input);
}
