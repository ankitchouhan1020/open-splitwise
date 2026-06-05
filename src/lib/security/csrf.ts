import type { NextRequest } from "next/server";
import { isProduction } from "@/lib/security/production";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function configuredAppOrigins(): string[] {
  const origins: string[] = [];
  for (const key of ["APP_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    const fromEnv = process.env[key]?.trim();
    if (fromEnv) {
      try {
        origins.push(new URL(fromEnv).origin);
      } catch {
        /* try next */
      }
    }
  }
  return [...new Set(origins)];
}

function requestHostOrigin(request: NextRequest): string | null {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (isProduction() ? "https" : "http");
  return `${proto}://${host}`;
}

/** Primary canonical origin (first configured APP URL). */
export function expectedRequestOrigin(request: NextRequest): string | null {
  const configured = configuredAppOrigins();
  if (configured.length > 0) return configured[0] ?? null;
  return requestHostOrigin(request);
}

function allowedMutationOrigins(request: NextRequest): Set<string> {
  const allowed = new Set(configuredAppOrigins());
  if (!isProduction()) {
    const fromRequest = requestHostOrigin(request);
    if (fromRequest) allowed.add(fromRequest);
  }
  return allowed;
}

export function isSameOriginMutation(request: NextRequest): boolean {
  if (!MUTATING_METHODS.has(request.method)) return true;

  const allowed = allowedMutationOrigins(request);
  if (allowed.size === 0) return !isProduction();

  const origin = request.headers.get("origin");
  if (origin) return allowed.has(origin);

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return !isProduction();
}
