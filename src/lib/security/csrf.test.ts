import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  expectedRequestOrigin,
  isSameOriginMutation,
} from "@/lib/security/csrf";

function request(
  url: string,
  method = "GET",
  headers: Record<string, string> = {},
) {
  return new NextRequest(new URL(url, "https://app.example.com"), {
    method,
    headers,
  });
}

describe("csrf", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = {
      ...env,
      NODE_ENV: "production",
      APP_URL: "https://app.example.com",
    };
  });

  afterEach(() => {
    process.env = env;
  });

  it("prefers APP_URL for expected origin", () => {
    const req = request("https://app.example.com/api/sync", "POST", {
      host: "evil.example.com",
    });
    expect(expectedRequestOrigin(req)).toBe("https://app.example.com");
  });

  it("rejects cross-origin mutations in production", () => {
    const req = request("https://app.example.com/api/sync", "POST", {
      origin: "https://evil.example.com",
    });
    expect(isSameOriginMutation(req)).toBe(false);
  });

  it("allows same-origin mutations", () => {
    const req = request("https://app.example.com/api/sync", "POST", {
      origin: "https://app.example.com",
    });
    expect(isSameOriginMutation(req)).toBe(true);
  });
});
