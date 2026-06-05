const WEAK_SESSION_SECRETS = new Set(["local-dev-only-change-me-32chars-min"]);

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Hide env checklist, redirect URIs, and copyable snippets from anonymous visitors. */
export function shouldExposeSetupDetails(opts: {
  sessionActive: boolean;
  oauthConfigured: boolean;
  dbConfigured: boolean;
}): boolean {
  if (!isProduction()) return true;
  if (opts.sessionActive) return true;
  if (!opts.oauthConfigured || !opts.dbConfigured) return true;
  return false;
}

export function assertProductionEnv(): void {
  if (!isProduction()) return;

  const errors: string[] = [];

  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters");
  } else if (WEAK_SESSION_SECRETS.has(secret)) {
    errors.push("SESSION_SECRET uses a known weak default");
  }

  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) {
    errors.push("APP_URL is required in production");
  }

  const redirectUri = process.env.SPLITWISE_REDIRECT_URI?.trim();
  if (!redirectUri) {
    errors.push("SPLITWISE_REDIRECT_URI is required in production");
  }

  if (appUrl && redirectUri) {
    try {
      const appOrigin = new URL(appUrl).origin;
      const redirectOrigin = new URL(redirectUri).origin;
      if (appOrigin !== redirectOrigin) {
        errors.push("SPLITWISE_REDIRECT_URI origin must match APP_URL origin");
      }
      const path = new URL(redirectUri).pathname.replace(/\/$/, "");
      if (path !== "/api/auth/splitwise/callback") {
        errors.push(
          "SPLITWISE_REDIRECT_URI must end with /api/auth/splitwise/callback",
        );
      }
    } catch {
      errors.push("APP_URL or SPLITWISE_REDIRECT_URI is not a valid URL");
    }
  }

  if (process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1") {
    errors.push("DEMO_MODE must be disabled in production");
  }

  if (errors.length > 0) {
    throw new Error(`Production security check failed: ${errors.join("; ")}`);
  }
}
