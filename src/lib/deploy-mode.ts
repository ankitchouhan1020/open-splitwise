/** Fallback session secret when OAuth is not configured (showcase deploy only). */
export const SHOWCASE_SESSION_FALLBACK = "showcase-deploy-only-32chars-min!!!";

/** Splitwise OAuth env is present enough to leave showcase mode. */
export function isOAuthConfigured(): boolean {
  const clientId = process.env.SPLITWISE_CLIENT_ID?.trim();
  const clientSecret = process.env.SPLITWISE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return false;

  if (process.env.SPLITWISE_REDIRECT_URI?.trim()) return true;

  return Boolean(
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim(),
  );
}

/**
 * Zero-config deploy: no Splitwise credentials → read-only sample data, no DB required.
 */
export function isShowcaseMode(): boolean {
  return !isOAuthConfigured();
}

export function isFullyConfiguredForProduction(): boolean {
  return isOAuthConfigured();
}
