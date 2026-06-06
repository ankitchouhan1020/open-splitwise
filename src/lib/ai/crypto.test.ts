import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptApiKey,
  encryptApiKey,
  formatApiKeyPreview,
} from "@/lib/ai/crypto";

describe("ai crypto", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = {
      ...env,
      SESSION_SECRET: "test-session-secret-at-least-32-chars-long",
    };
  });

  afterEach(() => {
    process.env = env;
  });

  it("round-trips API key encryption", () => {
    const plain = "sk-test-key-12345";
    const encrypted = encryptApiKey(plain);
    expect(encrypted).not.toContain(plain);
    expect(decryptApiKey(encrypted)).toBe(plain);
  });

  it("rejects invalid ciphertext", () => {
    expect(() => decryptApiKey("not-valid")).toThrow();
  });

  it("formats a masked key preview", () => {
    expect(formatApiKeyPreview("sk-or-v1-abcdefghijklmnop")).toBe(
      "sk-or-…mnop",
    );
    expect(formatApiKeyPreview("short")).toBe("sh…rt");
  });
});
