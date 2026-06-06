import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/crypto", () => ({
  decryptApiKey: vi.fn(),
}));

import { decryptApiKey } from "@/lib/ai/crypto";
import {
  isAiSettingsRecordReady,
  validateAiEnablement,
} from "@/lib/ai/availability";

describe("isAiSettingsRecordReady", () => {
  beforeEach(() => {
    vi.mocked(decryptApiKey).mockReset();
    vi.mocked(decryptApiKey).mockReturnValue("sk-test");
  });

  it("returns false when custom provider has no base URL", () => {
    expect(
      isAiSettingsRecordReady({
        enabled: true,
        provider: "custom",
        baseUrl: null,
        model: "gpt-4o-mini",
        hasKey: true,
        keyPreview: null,
        encryptedApiKey: "enc",
      }),
    ).toBe(false);
  });

  it("returns true for custom provider with base URL", () => {
    expect(
      isAiSettingsRecordReady({
        enabled: true,
        provider: "custom",
        baseUrl: "https://proxy.example/v1",
        model: "gpt-4o-mini",
        hasKey: true,
        keyPreview: null,
        encryptedApiKey: "enc",
      }),
    ).toBe(true);
  });
});

describe("validateAiEnablement", () => {
  it("requires a key when enabling AI", () => {
    expect(
      validateAiEnablement({
        enabled: true,
        provider: "openai",
        baseUrl: null,
        hasEncryptedKey: false,
      }),
    ).toEqual({ ok: false, error: "ai_key_required" });
  });

  it("requires base URL for custom provider", () => {
    expect(
      validateAiEnablement({
        enabled: true,
        provider: "custom",
        baseUrl: null,
        hasEncryptedKey: true,
      }),
    ).toEqual({ ok: false, error: "ai_base_url_required" });
  });

  it("allows disabled config without a key", () => {
    expect(
      validateAiEnablement({
        enabled: false,
        provider: "openai",
        baseUrl: null,
        hasEncryptedKey: false,
      }),
    ).toEqual({ ok: true });
  });
});
