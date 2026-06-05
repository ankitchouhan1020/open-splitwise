import { isShowcaseMode } from "@/lib/deploy-mode";
import type { AppSession } from "@/lib/session-config";
import { sessionShowsFakeData } from "@/lib/session-config";

const OAUTH_PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/auth/splitwise",
  "/api/auth/splitwise/callback",
  "/api/auth/splitwise/config",
]);

/** POST allowed while browsing sample / showcase data (not data mutations). */
export const DEMO_READ_ONLY_WRITE_ALLOWED = new Set([
  "/api/demo/stop",
  "/api/fake-data/toggle",
]);

export function isPublicApiPath(pathname: string): boolean {
  if (OAUTH_PUBLIC_API_PATHS.has(pathname)) return true;
  if (pathname === "/api/demo/start" && isShowcaseMode()) return true;
  return false;
}

export function isDemoReadOnlyContext(session: AppSession): boolean {
  return isShowcaseMode() || sessionShowsFakeData(session);
}

export function isDemoWriteBlocked(
  pathname: string,
  method: string,
  session: AppSession,
): boolean {
  if (method === "GET" || method === "HEAD") return false;
  if (!isDemoReadOnlyContext(session)) return false;
  return !DEMO_READ_ONLY_WRITE_ALLOWED.has(pathname);
}
