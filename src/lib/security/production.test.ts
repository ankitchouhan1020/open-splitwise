import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertProductionEnv,
  shouldExposeSetupDetails,
} from "@/lib/security/production";

describe("production security", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "production" };
  });

  afterEach(() => {
    process.env = env;
  });

  it("requires pinned URLs and a strong session secret in production", () => {
    process.env.SESSION_SECRET = "local-dev-only-change-me-32chars-min";
    expect(() => assertProductionEnv()).toThrow(/weak default/i);

    process.env.SESSION_SECRET = "x".repeat(32);
    expect(() => assertProductionEnv()).toThrow(/APP_URL/i);

    process.env.APP_URL = "https://app.example.com";
    expect(() => assertProductionEnv()).toThrow(/SPLITWISE_REDIRECT_URI/i);

    process.env.SPLITWISE_REDIRECT_URI =
      "https://evil.example.com/api/auth/splitwise/callback";
    expect(() => assertProductionEnv()).toThrow(/origin must match/i);

    process.env.SPLITWISE_REDIRECT_URI =
      "https://app.example.com/api/auth/splitwise/callback";
    process.env.DEMO_MODE = "true";
    expect(() => assertProductionEnv()).toThrow(/DEMO_MODE/i);

    delete process.env.DEMO_MODE;
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it("hides setup details from anonymous visitors once configured", () => {
    expect(
      shouldExposeSetupDetails({
        sessionActive: false,
        oauthConfigured: true,
        dbConfigured: true,
      }),
    ).toBe(false);
    expect(
      shouldExposeSetupDetails({
        sessionActive: true,
        oauthConfigured: true,
        dbConfigured: true,
      }),
    ).toBe(true);
  });
});
