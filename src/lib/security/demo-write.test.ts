import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isDemoReadOnlyContext,
  isDemoWriteBlocked,
  isPublicApiPath,
} from "@/lib/security/demo-write";
import type { AppSession } from "@/lib/session-config";

describe("demo-write security", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.SPLITWISE_CLIENT_ID;
    delete process.env.SPLITWISE_CLIENT_SECRET;
    delete process.env.SPLITWISE_REDIRECT_URI;
    delete process.env.APP_URL;
  });

  afterEach(() => {
    process.env = env;
  });

  it("treats showcase as read-only demo context", () => {
    expect(isDemoReadOnlyContext({})).toBe(true);
  });

  it("treats fake-data session as read-only when OAuth is configured", () => {
    process.env.SPLITWISE_CLIENT_ID = "id";
    process.env.SPLITWISE_CLIENT_SECRET = "secret";
    process.env.APP_URL = "https://app.example.com";
    const session: AppSession = { fakeData: true, accessToken: "tok" };
    expect(isDemoReadOnlyContext(session)).toBe(true);
  });

  it("allows only demo stop and mask toggle writes in read-only context", () => {
    expect(isDemoWriteBlocked("/api/expenses", "POST", {})).toBe(true);
    expect(isDemoWriteBlocked("/api/demo/stop", "POST", {})).toBe(false);
    expect(isDemoWriteBlocked("/api/fake-data/toggle", "POST", {})).toBe(false);
  });

  it("exposes demo start without CSRF only in showcase", () => {
    expect(isPublicApiPath("/api/demo/start")).toBe(true);
    expect(isPublicApiPath("/api/health")).toBe(true);

    process.env.SPLITWISE_CLIENT_ID = "id";
    process.env.SPLITWISE_CLIENT_SECRET = "secret";
    process.env.SPLITWISE_REDIRECT_URI =
      "https://app.example.com/api/auth/splitwise/callback";

    expect(isPublicApiPath("/api/demo/start")).toBe(false);
    expect(isPublicApiPath("/api/auth/splitwise")).toBe(true);
  });
});
