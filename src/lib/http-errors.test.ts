import { AiError } from "@/lib/ai/types";
import {
  SplitwiseAuthError,
  SplitwiseRateLimitError,
  SplitwiseServerError,
} from "@/lib/splitwise/errors";
import { SyncAlreadyInProgressError } from "@/lib/sync/run";
import { describe, expect, it } from "vitest";
import {
  aiErrorResponse,
  domainErrorResponse,
  httpStatusForErrorCode,
  routeErrorResponse,
  splitwiseErrorResponse,
} from "@/lib/http-errors";

describe("httpStatusForErrorCode", () => {
  it("maps auth and validation codes", () => {
    expect(httpStatusForErrorCode("not_connected")).toBe(401);
    expect(httpStatusForErrorCode("splitwise_validation")).toBe(400);
    expect(httpStatusForErrorCode("rate_limited")).toBe(429);
    expect(httpStatusForErrorCode("database_not_configured")).toBe(503);
  });

  it("uses 500 only for unknown server failures", () => {
    expect(httpStatusForErrorCode("ai_error")).toBe(500);
    expect(httpStatusForErrorCode("sync_failed")).toBe(500);
  });
});

describe("domainErrorResponse", () => {
  it("returns 401 for not_connected", async () => {
    const res = domainErrorResponse({ error: "not_connected" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "not_connected" });
  });

  it("returns 404 for not_found", async () => {
    const res = domainErrorResponse({ error: "not_found" });
    expect(res.status).toBe(404);
  });
});

describe("splitwiseErrorResponse", () => {
  it("maps auth errors to 401", () => {
    expect(splitwiseErrorResponse(new SplitwiseAuthError()).status).toBe(401);
  });

  it("maps rate limits to 429 with Retry-After", () => {
    const res = splitwiseErrorResponse(
      new SplitwiseRateLimitError("limited", 30),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("maps upstream outages to 502", () => {
    expect(splitwiseErrorResponse(new SplitwiseServerError(503)).status).toBe(
      502,
    );
  });
});

describe("aiErrorResponse", () => {
  it("maps misconfiguration to 400", () => {
    expect(
      aiErrorResponse(new AiError("bad key", "ai_misconfigured")).status,
    ).toBe(400);
  });

  it("maps provider auth failures to 400", () => {
    expect(
      aiErrorResponse(new AiError("invalid key", "ai_provider_error", 401))
        .status,
    ).toBe(400);
  });

  it("maps provider outages to 502", () => {
    expect(
      aiErrorResponse(new AiError("upstream down", "ai_provider_error", 503))
        .status,
    ).toBe(502);
  });

  it("maps unknown failures to 500", () => {
    expect(aiErrorResponse(new Error("boom")).status).toBe(500);
  });
});

describe("routeErrorResponse", () => {
  it("maps sync contention to 409", async () => {
    const res = routeErrorResponse(
      new SyncAlreadyInProgressError("Expense sync already in progress"),
      "sync_failed",
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "sync_in_progress" });
  });
});
