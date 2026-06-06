import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/settings", () => ({
  getAiSettingsRecord: vi.fn(),
}));

vi.mock("@/lib/ai/crypto", () => ({
  decryptApiKey: vi.fn(),
}));

vi.mock("@/lib/demo/session", () => ({
  isFakeDataRequest: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  isDatabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/db/account", () => ({
  getAuthenticatedAccountOwner: vi.fn(),
}));

import { isAiAvailable } from "@/lib/ai/availability";
import { requireAiAccount } from "@/lib/ai/guard";
import { decryptApiKey } from "@/lib/ai/crypto";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { getAiSettingsRecord } from "@/lib/ai/settings";

describe("isAiAvailable", () => {
  beforeEach(() => {
    vi.mocked(getAiSettingsRecord).mockReset();
    vi.mocked(decryptApiKey).mockReset();
  });

  it("returns false when disabled", async () => {
    vi.mocked(getAiSettingsRecord).mockResolvedValue({
      enabled: false,
      provider: "openai",
      baseUrl: null,
      model: "gpt-4o-mini",
      hasKey: true,
      keyPreview: null,
      encryptedApiKey: "enc",
    });

    await expect(isAiAvailable(1)).resolves.toBe(false);
  });

  it("returns false when no key", async () => {
    vi.mocked(getAiSettingsRecord).mockResolvedValue({
      enabled: true,
      provider: "openai",
      baseUrl: null,
      model: "gpt-4o-mini",
      hasKey: false,
      keyPreview: null,
      encryptedApiKey: null,
    });

    await expect(isAiAvailable(1)).resolves.toBe(false);
  });

  it("returns true when enabled and key decrypts", async () => {
    vi.mocked(getAiSettingsRecord).mockResolvedValue({
      enabled: true,
      provider: "openai",
      baseUrl: null,
      model: "gpt-4o-mini",
      hasKey: true,
      keyPreview: null,
      encryptedApiKey: "enc",
    });
    vi.mocked(decryptApiKey).mockReturnValue("sk-test");

    await expect(isAiAvailable(1)).resolves.toBe(true);
  });

  it("returns false when decrypt fails", async () => {
    vi.mocked(getAiSettingsRecord).mockResolvedValue({
      enabled: true,
      provider: "openai",
      baseUrl: null,
      model: "gpt-4o-mini",
      hasKey: true,
      keyPreview: null,
      encryptedApiKey: "bad",
    });
    vi.mocked(decryptApiKey).mockImplementation(() => {
      throw new Error("bad key");
    });

    await expect(isAiAvailable(1)).resolves.toBe(false);
  });

  it("returns false for custom provider without base URL", async () => {
    vi.mocked(getAiSettingsRecord).mockResolvedValue({
      enabled: true,
      provider: "custom",
      baseUrl: null,
      model: "gpt-4o-mini",
      hasKey: true,
      keyPreview: null,
      encryptedApiKey: "enc",
    });
    vi.mocked(decryptApiKey).mockReturnValue("sk-test");

    await expect(isAiAvailable(1)).resolves.toBe(false);
  });
});

describe("requireAiAccount", () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConfigured).mockReset();
    vi.mocked(isFakeDataRequest).mockReset();
    vi.mocked(getAuthenticatedAccountOwner).mockReset();
    vi.mocked(getAiSettingsRecord).mockReset();
    vi.mocked(decryptApiKey).mockReset();
  });

  it("blocks AI when browsing sample data", async () => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(isFakeDataRequest).mockResolvedValue(true);

    const result = await requireAiAccount();
    if ("error" in result && result.error) {
      expect(result.error.status).toBe(403);
    } else {
      expect.fail("expected ai_disabled error");
    }
  });

  it("blocks AI when settings are not ready", async () => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(isFakeDataRequest).mockResolvedValue(false);
    vi.mocked(getAuthenticatedAccountOwner).mockResolvedValue({
      id: 1,
    } as Awaited<ReturnType<typeof getAuthenticatedAccountOwner>>);
    vi.mocked(getAiSettingsRecord).mockResolvedValue({
      enabled: true,
      provider: "openai",
      baseUrl: null,
      model: "gpt-4o-mini",
      hasKey: false,
      keyPreview: null,
      encryptedApiKey: null,
    });

    const result = await requireAiAccount();
    if ("error" in result && result.error) {
      expect(result.error.status).toBe(403);
    } else {
      expect.fail("expected ai_disabled error");
    }
  });

  it("allows AI when fully configured", async () => {
    vi.mocked(isDatabaseConfigured).mockReturnValue(true);
    vi.mocked(isFakeDataRequest).mockResolvedValue(false);
    vi.mocked(getAuthenticatedAccountOwner).mockResolvedValue({
      id: 42,
    } as Awaited<ReturnType<typeof getAuthenticatedAccountOwner>>);
    vi.mocked(getAiSettingsRecord).mockResolvedValue({
      enabled: true,
      provider: "openai",
      baseUrl: null,
      model: "gpt-4o-mini",
      hasKey: true,
      keyPreview: null,
      encryptedApiKey: "enc",
    });
    vi.mocked(decryptApiKey).mockReturnValue("sk-test");

    const result = await requireAiAccount();
    if ("owner" in result && result.owner) {
      expect(result.owner.id).toBe(42);
    } else {
      expect.fail("expected owner");
    }
  });
});
