import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appPathUrl,
  isInternalRequestOrigin,
  resolveAppUrl,
} from "@/lib/app-url";

describe("app-url", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.SPLITWISE_REDIRECT_URI;
  });

  afterEach(() => {
    process.env = env;
  });

  it("detects Docker bind addresses", () => {
    expect(isInternalRequestOrigin("https://0.0.0.0:8080")).toBe(true);
    expect(isInternalRequestOrigin("http://localhost:3000")).toBe(false);
  });

  it("uses APP_URL instead of internal request origin", () => {
    process.env.APP_URL = "https://split.example.com";
    expect(resolveAppUrl("https://0.0.0.0:8080")).toBe(
      "https://split.example.com",
    );
  });

  it("falls back to SPLITWISE_REDIRECT_URI origin", () => {
    process.env.SPLITWISE_REDIRECT_URI =
      "https://split.example.com/api/auth/splitwise/callback";
    expect(resolveAppUrl("https://0.0.0.0:8080")).toBe(
      "https://split.example.com",
    );
  });

  it("builds app paths from public origin", () => {
    process.env.APP_URL = "https://split.example.com";
    expect(appPathUrl("/settings", "https://0.0.0.0:8080").href).toBe(
      "https://split.example.com/settings",
    );
  });
});
