import { describe, expect, it } from "vitest";
import {
  mapSplitwiseResponseError,
  parseRetryAfterSeconds,
  retryDelayMs,
  SplitwiseAuthError,
  SplitwiseNotFoundError,
  SplitwiseRateLimitError,
  SplitwiseServerError,
  isRetryableError,
} from "@/lib/splitwise/errors";

describe("parseRetryAfterSeconds", () => {
  it("parses numeric Retry-After", () => {
    expect(parseRetryAfterSeconds("30")).toBe(30);
  });

  it("returns null for missing header", () => {
    expect(parseRetryAfterSeconds(null)).toBeNull();
  });
});

describe("mapSplitwiseResponseError", () => {
  it("maps 401 to auth error", () => {
    const err = mapSplitwiseResponseError(401, "unauthorized", null);
    expect(err).toBeInstanceOf(SplitwiseAuthError);
    expect(err.code).toBe("auth_required");
  });

  it("maps 403 to forbidden", () => {
    const err = mapSplitwiseResponseError(403, "forbidden", null);
    expect(err.code).toBe("forbidden");
  });

  it("maps 404 to not found", () => {
    const err = mapSplitwiseResponseError(404, "missing", null);
    expect(err).toBeInstanceOf(SplitwiseNotFoundError);
  });

  it("maps 429 with Retry-After", () => {
    const err = mapSplitwiseResponseError(429, "slow down", "12");
    expect(err).toBeInstanceOf(SplitwiseRateLimitError);
    expect(err.retryAfterSeconds).toBe(12);
  });

  it("maps 503 to server error", () => {
    const err = mapSplitwiseResponseError(503, "unavailable", null);
    expect(err).toBeInstanceOf(SplitwiseServerError);
    expect(isRetryableError(err)).toBe(true);
  });
});

describe("retryDelayMs", () => {
  it("uses Retry-After for rate limits", () => {
    const err = new SplitwiseRateLimitError("limited", 5);
    expect(retryDelayMs(0, err, 500)).toBe(5000);
  });

  it("uses exponential backoff otherwise", () => {
    const err = new SplitwiseServerError(500);
    expect(retryDelayMs(2, err, 500)).toBe(2000);
  });
});
