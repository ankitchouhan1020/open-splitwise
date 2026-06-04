import { getSuggestedRedirectUri, resolveAppUrl } from "@/lib/app-url";

/** Trimmed SPLITWISE_REDIRECT_URI when set and valid. */
export function readConfiguredRedirectUri(): string | undefined {
  const raw = process.env.SPLITWISE_REDIRECT_URI?.trim();
  if (!raw) return undefined;
  try {
    new URL(raw);
    return raw;
  } catch {
    return undefined;
  }
}

/**
 * OAuth callback URL: SPLITWISE_REDIRECT_URI wins when set; otherwise derived from
 * APP_URL / NEXT_PUBLIC_APP_URL / the incoming request origin.
 */
export function resolveSplitwiseRedirectUri(requestOrigin?: string): string {
  const configured = readConfiguredRedirectUri();
  if (configured) return configured;

  const origin = requestOrigin ?? "http://localhost:3000";
  return getSuggestedRedirectUri(resolveAppUrl(origin));
}
