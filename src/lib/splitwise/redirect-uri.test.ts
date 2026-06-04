import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readConfiguredRedirectUri,
  resolveSplitwiseRedirectUri,
} from "@/lib/splitwise/redirect-uri";

describe("splitwise redirect URI", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.SPLITWISE_REDIRECT_URI;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env = env;
  });

  it("prefers SPLITWISE_REDIRECT_URI over request origin", () => {
    process.env.SPLITWISE_REDIRECT_URI =
      "https://custom.example.com/api/auth/splitwise/callback";
    expect(resolveSplitwiseRedirectUri("https://railway.app")).toBe(
      "https://custom.example.com/api/auth/splitwise/callback",
    );
  });

  it("derives from request when SPLITWISE_REDIRECT_URI is unset", () => {
    expect(resolveSplitwiseRedirectUri("https://prod.up.railway.app")).toBe(
      "https://prod.up.railway.app/api/auth/splitwise/callback",
    );
  });

  it("derives from APP_URL when redirect env is unset", () => {
    process.env.APP_URL = "https://app.example.com/";
    expect(resolveSplitwiseRedirectUri("http://localhost:3000")).toBe(
      "https://app.example.com/api/auth/splitwise/callback",
    );
  });

  it("trims SPLITWISE_REDIRECT_URI", () => {
    process.env.SPLITWISE_REDIRECT_URI =
      "  https://custom.example.com/api/auth/splitwise/callback  ";
    expect(readConfiguredRedirectUri()).toBe(
      "https://custom.example.com/api/auth/splitwise/callback",
    );
  });
});
