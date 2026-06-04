export function getSuggestedRedirectUri(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/api/auth/splitwise/callback`;
}

export function resolveAppUrl(requestOrigin: string): string {
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
  return requestOrigin.replace(/\/$/, "");
}
