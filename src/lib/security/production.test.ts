import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertProductionEnv,
  shouldExposeSetupDetails,
} from "@/lib/security/production";

describe("production security", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "production" };
    delete process.env.SPLITWISE_CLIENT_ID;
    delete process.env.SPLITWISE_CLIENT_SECRET;
    delete process.env.SPLITWISE_REDIRECT_URI;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.SESSION_SECRET;
    delete process.env.DEMO_MODE;
  });

  afterEach(() => {
    process.env = env;
  });

  it("allows startup in showcase mode without secrets", () => {
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it("requires pinned URLs and a strong session secret when OAuth is configured", () => {
    process.env.SPLITWISE_CLIENT_ID = "client";
    process.env.SPLITWISE_CLIENT_SECRET = "secret";
    process.env.SPLITWISE_REDIRECT_URI =
      "https://app.example.com/api/auth/splitwise/callback";
    process.env.APP_URL = "https://app.example.com";

    process.env.SESSION_SECRET = "local-dev-only-change-me-32chars-min";
    expect(() => assertProductionEnv()).toThrow(/weak default/i);

    process.env.SESSION_SECRET = "x".repeat(32);
    expect(() => assertProductionEnv()).not.toThrow();

    delete process.env.APP_URL;
    expect(() => assertProductionEnv()).toThrow(/APP_URL/i);

    process.env.APP_URL = "https://app.example.com";
    delete process.env.SPLITWISE_REDIRECT_URI;
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

  it("shows setup details in showcase production", () => {
    expect(
      shouldExposeSetupDetails({
        sessionActive: false,
        oauthConfigured: false,
        dbConfigured: false,
      }),
    ).toBe(true);
  });
});
