import type { NextRequest } from "next/server";
import { isProduction } from "@/lib/security/production";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function expectedRequestOrigin(request: NextRequest): string | null {
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

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (isProduction() ? "https" : "http");
  return `${proto}://${host}`;
}

export function isSameOriginMutation(request: NextRequest): boolean {
  if (!MUTATING_METHODS.has(request.method)) return true;

  const expected = expectedRequestOrigin(request);
  if (!expected) return !isProduction();

  const origin = request.headers.get("origin");
  if (origin) return origin === expected;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }

  return !isProduction();
}
