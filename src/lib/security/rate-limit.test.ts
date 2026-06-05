import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AUTHENTICATED_READ_RULE,
  authenticatedReadRateLimitKey,
  checkRateLimit,
  clientIpFromHeaders,
  resetRateLimitsForTests,
} from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  const env = process.env;

  afterEach(() => {
    resetRateLimitsForTests();
    process.env = env;
  });

  it("blocks requests after the configured limit", () => {
    const rule = { pathname: "/api/sync", limit: 2, windowMs: 60_000 };
    expect(checkRateLimit("1.2.3.4", rule, 1_000).allowed).toBe(true);
    expect(checkRateLimit("1.2.3.4", rule, 1_100).allowed).toBe(true);
    const blocked = checkRateLimit("1.2.3.4", rule, 1_200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("scopes authenticated read limits per session", () => {
    const keyA = authenticatedReadRateLimitKey("1.2.3.4", {
      splitwiseUserId: 1,
    });
    const keyB = authenticatedReadRateLimitKey("1.2.3.4", {
      splitwiseUserId: 2,
    });
    expect(keyA).not.toBe(keyB);
    expect(checkRateLimit(keyA, AUTHENTICATED_READ_RULE, 1_000).allowed).toBe(
      true,
    );
  });
});

describe("client IP extraction", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "production" };
    delete process.env.TRUST_PROXY_IP;
  });

  afterEach(() => {
    process.env = env;
  });

  it("prefers Cloudflare connecting IP in production", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("does not trust x-forwarded-for in production without TRUST_PROXY_IP", () => {
    const headers = new Headers({ "x-forwarded-for": "198.51.100.1" });
    expect(clientIpFromHeaders(headers)).toBe("untrusted");
  });

  it("trusts proxy headers when TRUST_PROXY_IP is set", () => {
    process.env.TRUST_PROXY_IP = "true";
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(clientIpFromHeaders(headers)).toBe("198.51.100.1");
  });
});
