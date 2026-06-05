import { getIronSession } from "iron-session";
import { appPathUrl } from "@/lib/app-url";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import {
  AUTHENTICATED_READ_RULE,
  authenticatedReadRateLimitKey,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitRuleForPath,
} from "@/lib/security/rate-limit";
import { isSameOriginMutation } from "@/lib/security/csrf";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getIronSessionOptions,
  sessionIsActive,
  sessionShowsFakeData,
  type AppSession,
} from "@/lib/session-config";

const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/auth/splitwise",
  "/api/auth/splitwise/callback",
  "/api/auth/splitwise/config",
  "/api/demo/start",
]);

const FAKE_DATA_WRITE_ALLOWED = new Set([
  "/api/demo/stop",
  "/api/fake-data/toggle",
]);

const PROTECTED_PAGE_PREFIXES = [
  "/explore",
  "/insights",
  "/friends",
  "/groups",
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PATHS.has(pathname);
}

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function sessionFromRequest(
  request: NextRequest,
  response: NextResponse,
): Promise<AppSession> {
  return getIronSession<AppSession>(request, response, getIronSessionOptions());
}

function rateLimitedResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = clientIpFromHeaders(request.headers);
    const rateRule = rateLimitRuleForPath(pathname);
    if (rateRule) {
      const { allowed, retryAfterSec } = checkRateLimit(ip, rateRule);
      if (!allowed) return rateLimitedResponse(retryAfterSec);
    }

    if (!isPublicApi(pathname) && !isSameOriginMutation(request)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  try {
    const session = await sessionFromRequest(request, response);

    if (pathname.startsWith("/api/")) {
      if (!sessionIsActive(session)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }

      if (request.method === "GET") {
        const ip = clientIpFromHeaders(request.headers);
        const readKey = authenticatedReadRateLimitKey(ip, session);
        const { allowed, retryAfterSec } = checkRateLimit(
          readKey,
          AUTHENTICATED_READ_RULE,
        );
        if (!allowed) return rateLimitedResponse(retryAfterSec);
      }

      if (
        sessionShowsFakeData(session) &&
        request.method !== "GET" &&
        !FAKE_DATA_WRITE_ALLOWED.has(pathname)
      ) {
        return NextResponse.json(
          { error: "fake_data_read_only" },
          { status: 403 },
        );
      }
      return response;
    }

    if (isProtectedPage(pathname) && !sessionIsActive(session)) {
      const origin = requestOriginFromHeaders(request.headers);
      const settings = appPathUrl("/settings", origin);
      settings.searchParams.set("error", "connect_required");
      return NextResponse.redirect(settings);
    }

    return response;
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/explore",
    "/explore/:path*",
    "/insights",
    "/insights/:path*",
    "/friends",
    "/groups",
    "/groups/:path*",
  ],
};
