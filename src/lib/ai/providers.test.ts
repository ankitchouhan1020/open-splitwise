import { describe, expect, it } from "vitest";
import {
  AI_PROVIDERS,
  DEFAULT_AI_PROVIDER,
  defaultModelForProvider,
  getProviderApi,
  parseAiProvider,
  resolveProviderBaseUrl,
} from "@/lib/ai/providers";

describe("ai providers", () => {
  it("loads providers from config file", () => {
    expect(Object.keys(AI_PROVIDERS)).toContain("openrouter");
    expect(Object.keys(AI_PROVIDERS)).toContain("gemini");
    expect(Object.keys(AI_PROVIDERS)).toContain("claude");
    expect(DEFAULT_AI_PROVIDER).toBe("openai");
  });

  it("parses known provider ids", () => {
    expect(parseAiProvider("openrouter")).toBe("openrouter");
    expect(parseAiProvider("gemini")).toBe("gemini");
    expect(parseAiProvider("claude")).toBe("claude");
  });

  it("falls back unknown provider to default", () => {
    expect(parseAiProvider("unknown")).toBe(DEFAULT_AI_PROVIDER);
  });

  it("resolves default base URLs", () => {
    expect(resolveProviderBaseUrl("openrouter", null)).toBe(
      AI_PROVIDERS.openrouter.defaultBaseUrl,
    );
    expect(resolveProviderBaseUrl("gemini", null)).toBe(
      AI_PROVIDERS.gemini.defaultBaseUrl,
    );
    expect(resolveProviderBaseUrl("claude", null)).toBe(
      AI_PROVIDERS.claude.defaultBaseUrl,
    );
  });

  it("requires base URL for custom provider", () => {
    expect(() => resolveProviderBaseUrl("custom", null)).toThrow();
    expect(resolveProviderBaseUrl("custom", "https://proxy.example/v1")).toBe(
      "https://proxy.example/v1",
    );
  });

  it("maps providers to API adapters", () => {
    expect(getProviderApi("openai")).toBe("openai-chat");
    expect(getProviderApi("openrouter")).toBe("openai-chat");
    expect(getProviderApi("gemini")).toBe("gemini");
    expect(getProviderApi("claude")).toBe("claude");
  });

  it("returns default models per provider", () => {
    expect(defaultModelForProvider("openrouter")).toBe(
      AI_PROVIDERS.openrouter.defaultModel,
    );
    expect(defaultModelForProvider("claude")).toBe(
      AI_PROVIDERS.claude.defaultModel,
    );
  });
});
