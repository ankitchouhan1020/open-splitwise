export function getSuggestedRedirectUri(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/api/auth/splitwise/callback`;
}

/** Hostnames that must never be used for browser redirects (Docker bind address, etc.). */
export function isInternalRequestOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    const host = hostname.toLowerCase();
    return host === "0.0.0.0" || host === "[::]" || host === "::";
  } catch {
    return true;
  }
}

/** Public app origin from env or request; ignores SPLITWISE_REDIRECT_URI. */
export function resolvePublicAppUrl(requestOrigin: string): string {
  for (const key of ["APP_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    const fromEnv = process.env[key]?.trim();
    if (fromEnv) {
      try {
        return new URL(fromEnv).origin;
      } catch {
        /* try next */
      }
    }
  }

  const origin = requestOrigin.replace(/\/$/, "");
  if (isInternalRequestOrigin(origin)) {
    throw new Error(
      "Set APP_URL or NEXT_PUBLIC_APP_URL — server Host is not a public URL",
    );
  }
  return origin;
}

/** Like resolvePublicAppUrl, but falls back to SPLITWISE_REDIRECT_URI origin (Docker/proxy). */
export function resolveAppUrl(requestOrigin: string): string {
  try {
    return resolvePublicAppUrl(requestOrigin);
  } catch {
    const rawRedirect = process.env.SPLITWISE_REDIRECT_URI?.trim();
    if (rawRedirect) {
      try {
        return new URL(rawRedirect).origin;
      } catch {
        /* fall through */
      }
    }
    throw new Error(
      "Set APP_URL or NEXT_PUBLIC_APP_URL — server Host is not a public URL",
    );
  }
}

/** Build an in-app URL using the public origin, not the internal bind address. */
export function appPathUrl(path: string, requestOrigin: string): URL {
  return new URL(path, resolveAppUrl(requestOrigin));
}
