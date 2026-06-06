import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchJson, FetchJsonError } from "@/lib/query/fetch-json";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("maps HTTP 429 to rate_limited when the body has no error code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({}),
      }),
    );

    await expect(fetchJson("/api/ai/narrative")).rejects.toEqual(
      new FetchJsonError("rate_limited", 429),
    );
  });

  it("prefers the API error code from the response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: "rate_limited" }),
      }),
    );

    await expect(fetchJson("/api/ai/narrative")).rejects.toEqual(
      new FetchJsonError("rate_limited", 429),
    );
  });
});
