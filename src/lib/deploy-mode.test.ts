import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isOAuthConfigured,
  isShowcaseMode,
  SHOWCASE_SESSION_FALLBACK,
} from "@/lib/deploy-mode";

describe("deploy-mode", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.SPLITWISE_CLIENT_ID;
    delete process.env.SPLITWISE_CLIENT_SECRET;
    delete process.env.SPLITWISE_REDIRECT_URI;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env = env;
  });

  it("treats missing OAuth as showcase mode", () => {
    expect(isOAuthConfigured()).toBe(false);
    expect(isShowcaseMode()).toBe(true);
  });

  it("leaves showcase when Splitwise client credentials and redirect are set", () => {
    process.env.SPLITWISE_CLIENT_ID = "id";
    process.env.SPLITWISE_CLIENT_SECRET = "secret";
    process.env.SPLITWISE_REDIRECT_URI =
      "https://app.example.com/api/auth/splitwise/callback";
    expect(isOAuthConfigured()).toBe(true);
    expect(isShowcaseMode()).toBe(false);
  });

  it("leaves showcase when redirect can be derived from APP_URL", () => {
    process.env.SPLITWISE_CLIENT_ID = "id";
    process.env.SPLITWISE_CLIENT_SECRET = "secret";
    process.env.APP_URL = "https://app.example.com";
    expect(isOAuthConfigured()).toBe(true);
    expect(isShowcaseMode()).toBe(false);
  });

  it("uses a long enough showcase session fallback", () => {
    expect(SHOWCASE_SESSION_FALLBACK.length).toBeGreaterThanOrEqual(32);
  });
});
