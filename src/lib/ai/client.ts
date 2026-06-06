import "server-only";

import { normalizeStructuredJson } from "@/lib/ai/json-schema";
import { getProviderApi } from "@/lib/ai/providers";
import type { AiResponseSchema } from "@/lib/ai/response-schemas";
import type { AiClientConfig } from "@/lib/ai/types";
import { AiError } from "@/lib/ai/types";
import type { z } from "zod";

const REQUEST_TIMEOUT_MS = 30_000;
const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_STRUCTURED_OUTPUTS_BETA = "structured-outputs-2025-11-01";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CompleteJsonInput<T extends z.ZodType> = {
  config: AiClientConfig;
  responseSchema: AiResponseSchema<T>;
  messages: ChatMessage[];
  signal: AbortSignal;
  temperature?: number;
};

function validateStructuredResponse<T extends z.ZodType>(
  raw: unknown,
  responseSchema: AiResponseSchema<T>,
): z.infer<T> {
  const normalized = normalizeStructuredJson(raw);
  const result = responseSchema.zod.safeParse(normalized);
  if (!result.success) {
    throw new AiError("AI response failed validation", "ai_parse_error");
  }
  return result.data;
}

function parseJsonContent<T extends z.ZodType>(
  content: string,
  responseSchema: AiResponseSchema<T>,
): z.infer<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiError("AI returned invalid JSON", "ai_parse_error");
  }
  return validateStructuredResponse(parsed, responseSchema);
}

function providerErrorMessage(
  body: { error?: { message?: string } },
  status: number,
): string {
  return body.error?.message ?? `Provider returned ${status}`;
}

function openAiJsonSchemaBody(responseSchema: AiResponseSchema) {
  return {
    type: "json_schema",
    json_schema: {
      name: responseSchema.name,
      strict: true,
      schema: responseSchema.jsonSchema,
    },
  };
}

async function completeJsonOpenAiChat<T extends z.ZodType>(
  input: CompleteJsonInput<T>,
): Promise<z.infer<T>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (input.config.provider === "openrouter") {
    const appUrl =
      process.env.APP_URL?.trim() ??
      process.env.NEXT_PUBLIC_APP_URL?.trim() ??
      "https://open-splitwise.local";
    headers["HTTP-Referer"] = appUrl;
    headers["X-Title"] = "Open Splitwise";
  }

  const res = await fetch(`${input.config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: input.config.model,
      messages: input.messages,
      response_format: openAiJsonSchemaBody(input.responseSchema),
      temperature: input.temperature ?? 0.2,
    }),
    signal: input.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    throw new AiError(
      providerErrorMessage(body, res.status),
      "ai_provider_error",
      res.status,
    );
  }

  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiError("Empty response from AI provider", "ai_provider_error");
  }

  return parseJsonContent(content, input.responseSchema);
}

async function completeJsonClaude<T extends z.ZodType>(
  input: CompleteJsonInput<T>,
): Promise<z.infer<T>> {
  const system =
    input.messages.find((m) => m.role === "system")?.content ??
    "Return valid JSON matching the requested schema.";
  const conversation = input.messages.filter((m) => m.role !== "system");

  const res = await fetch(`${input.config.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": input.config.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-beta": ANTHROPIC_STRUCTURED_OUTPUTS_BETA,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.config.model,
      max_tokens: 2048,
      system,
      messages: conversation.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      output_format: {
        type: "json_schema",
        schema: input.responseSchema.jsonSchema,
      },
      temperature: input.temperature ?? 0.2,
    }),
    signal: input.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    content?: Array<{ type?: string; text?: string }>;
  };

  if (!res.ok) {
    throw new AiError(
      providerErrorMessage(body, res.status),
      "ai_provider_error",
      res.status,
    );
  }

  const content = body.content?.find((block) => block.type === "text")?.text;
  if (!content) {
    throw new AiError("Empty response from AI provider", "ai_provider_error");
  }

  return parseJsonContent(content, input.responseSchema);
}

async function completeJsonGemini<T extends z.ZodType>(
  input: CompleteJsonInput<T>,
): Promise<z.infer<T>> {
  const system = input.messages.find((m) => m.role === "system")?.content;
  const userParts = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n\n");

  const url = `${input.config.baseUrl}/models/${encodeURIComponent(input.config.model)}:generateContent?key=${encodeURIComponent(input.config.apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: [{ role: "user", parts: [{ text: userParts }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: input.responseSchema.jsonSchema,
        temperature: input.temperature ?? 0.2,
      },
    }),
    signal: input.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  if (!res.ok) {
    throw new AiError(
      providerErrorMessage(body, res.status),
      "ai_provider_error",
      res.status,
    );
  }

  const content = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new AiError("Empty response from AI provider", "ai_provider_error");
  }

  return parseJsonContent(content, input.responseSchema);
}

export async function completeJson<T extends z.ZodType>(
  input: Omit<CompleteJsonInput<T>, "signal"> & { temperature?: number },
): Promise<z.infer<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const requestInput: CompleteJsonInput<T> = {
    ...input,
    signal: controller.signal,
  };

  try {
    const api = getProviderApi(input.config.provider);
    switch (api) {
      case "openai-chat":
        return await completeJsonOpenAiChat(requestInput);
      case "claude":
        return await completeJsonClaude(requestInput);
      case "gemini":
        return await completeJsonGemini(requestInput);
      default:
        throw new AiError("Unsupported AI provider", "ai_misconfigured");
    }
  } catch (err) {
    if (err instanceof AiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiError("AI request timed out", "ai_provider_error", 408);
    }
    const message = err instanceof Error ? err.message : "AI request failed";
    throw new AiError(message, "ai_provider_error");
  } finally {
    clearTimeout(timeout);
  }
}
