import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getSetupStatus,
  getSuggestedRedirectUri,
  resolveAppUrl,
} from "@/lib/setup/status";

describe("setup status", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.SESSION_SECRET;
    delete process.env.SPLITWISE_CLIENT_ID;
    delete process.env.SPLITWISE_CLIENT_SECRET;
    delete process.env.SPLITWISE_REDIRECT_URI;
    delete process.env.DATABASE_URL;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env = env;
  });

  it("derives redirect URI from request origin", () => {
    const setup = getSetupStatus("http://localhost:3000");
    expect(setup.appUrl).toBe("http://localhost:3000");
    expect(setup.redirectUri).toBe(
      "http://localhost:3000/api/auth/splitwise/callback",
    );
  });

  it("prefers NEXT_PUBLIC_APP_URL over request origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://splitwise.example.com";
    const setup = getSetupStatus("http://localhost:3000");
    expect(setup.appUrl).toBe("https://splitwise.example.com");
    expect(setup.suggestedRedirectUri).toBe(
      "https://splitwise.example.com/api/auth/splitwise/callback",
    );
  });

  it("prefers APP_URL over request origin", () => {
    process.env.APP_URL = "https://app.example.com";
    const setup = getSetupStatus("http://localhost:3000");
    expect(setup.appUrl).toBe("https://app.example.com");
    expect(setup.redirectUri).toBe(
      "https://app.example.com/api/auth/splitwise/callback",
    );
  });

  it("uses SPLITWISE_REDIRECT_URI for redirectUri when set", () => {
    process.env.SPLITWISE_REDIRECT_URI =
      "https://custom.example.com/api/auth/splitwise/callback";
    const setup = getSetupStatus("https://railway.app");
    expect(setup.redirectUri).toBe(
      "https://custom.example.com/api/auth/splitwise/callback",
    );
  });

  it("marks env vars individually", () => {
    process.env.SESSION_SECRET = "x".repeat(32);
    process.env.SPLITWISE_CLIENT_ID = "abc";
    const setup = getSetupStatus("http://localhost:3000");
    const session = setup.envVars.find((v) => v.key === "SESSION_SECRET");
    const clientId = setup.envVars.find((v) => v.key === "SPLITWISE_CLIENT_ID");
    const secret = setup.envVars.find(
      (v) => v.key === "SPLITWISE_CLIENT_SECRET",
    );
    expect(session?.configured).toBe(true);
    expect(clientId?.configured).toBe(true);
    expect(secret?.configured).toBe(false);
  });

  it("never embeds configured secrets in env snippet", () => {
    process.env.SESSION_SECRET = "x".repeat(32);
    process.env.SPLITWISE_CLIENT_ID = "live-client-id-value";
    process.env.SPLITWISE_CLIENT_SECRET = "live-client-secret-value";
    process.env.DATABASE_URL =
      "postgresql://prod_user:prod_pass@db.example.com:5432/open_splitwise";
    const setup = getSetupStatus("http://localhost:3000");
    expect(setup.envSnippet).not.toContain("live-client-id-value");
    expect(setup.envSnippet).not.toContain("live-client-secret-value");
    expect(setup.envSnippet).not.toContain("prod_user");
    expect(setup.envSnippet).not.toContain("prod_pass");
    expect(setup.envSnippet).toContain("SPLITWISE_CLIENT_ID=<set>");
    expect(setup.envSnippet).toContain("SPLITWISE_CLIENT_SECRET=<set>");
    expect(setup.envSnippet).toContain("DATABASE_URL=<set>");
  });

  it("detects redirect URI mismatch", () => {
    process.env.SPLITWISE_REDIRECT_URI =
      "http://wrong.example.com/api/auth/splitwise/callback";
    const setup = getSetupStatus("http://localhost:3000");
    expect(setup.redirectUriMismatch).toBe(true);
  });
});

describe("setup helpers", () => {
  it("builds suggested redirect URI", () => {
    expect(getSuggestedRedirectUri("http://localhost:3000/")).toBe(
      "http://localhost:3000/api/auth/splitwise/callback",
    );
  });

  it("resolves app URL from env", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test/";
    expect(resolveAppUrl("http://localhost:3000")).toBe("https://app.test");
  });

  it("prefers APP_URL over NEXT_PUBLIC_APP_URL", () => {
    process.env.APP_URL = "https://primary.test";
    process.env.NEXT_PUBLIC_APP_URL = "https://secondary.test";
    expect(resolveAppUrl("http://localhost:3000")).toBe("https://primary.test");
  });
});
