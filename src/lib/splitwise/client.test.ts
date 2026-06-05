import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SplitwiseClient } from "@/lib/splitwise/client";
import {
  SplitwiseAuthError,
  SplitwiseRateLimitError,
} from "@/lib/splitwise/errors";

describe("SplitwiseClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns JSON on success", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ user: { id: 1 } }), { status: 200 }),
      );
    const client = new SplitwiseClient({
      accessToken: "token",
      fetchImpl,
    });
    const data = await client.get<{ user: { id: number } }>("get_current_user");
    expect(data.user.id).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("throws auth error on 401 without retry", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("unauthorized", { status: 401 }));
    const client = new SplitwiseClient({
      accessToken: "bad",
      maxRetries: 2,
      fetchImpl,
    });
    await expect(client.get("get_current_user")).rejects.toBeInstanceOf(
      SplitwiseAuthError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": "1" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const client = new SplitwiseClient({
      accessToken: "token",
      maxRetries: 2,
      baseDelayMs: 100,
      fetchImpl,
    });

    const promise = client.get<{ ok: boolean }>("get_current_user");
    await vi.advanceTimersByTimeAsync(1000);
    const data = await promise;

    expect(data.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws rate limit after max retries", async () => {
    const fetchImpl = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": "0" },
        }),
      ),
    );
    const client = new SplitwiseClient({
      accessToken: "token",
      maxRetries: 1,
      baseDelayMs: 10,
      fetchImpl,
    });

    const promise = client.get("get_current_user");
    const assertion = expect(promise).rejects.toBeInstanceOf(
      SplitwiseRateLimitError,
    );
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 with exponential backoff", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("error", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: 2 } }), { status: 200 }),
      );

    const client = new SplitwiseClient({
      accessToken: "token",
      maxRetries: 2,
      baseDelayMs: 100,
      fetchImpl,
    });

    const promise = client.get("get_current_user");
    await vi.advanceTimersByTimeAsync(100);
    const data = await promise;

    expect(data).toEqual({ user: { id: 2 } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
