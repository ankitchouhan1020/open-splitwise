import { getIronSession } from "iron-session";
import { appPathUrl } from "@/lib/app-url";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import { isSameOriginMutation } from "@/lib/security/csrf";
import { isDemoWriteBlocked, isPublicApiPath } from "@/lib/security/demo-write";
import {
  AUTHENTICATED_READ_RULE,
  authenticatedReadRateLimitKey,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitRuleForPath,
} from "@/lib/security/rate-limit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getIronSessionOptions,
  sessionIsActive,
  type AppSession,
} from "@/lib/session-config";

const PROTECTED_PAGE_PREFIXES = [
  "/explore",
  "/insights",
  "/friends",
  "/groups",
];

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function sessionFromRequest(
  request: NextRequest,
  response: NextResponse,
) {
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

    if (!isPublicApiPath(pathname) && !isSameOriginMutation(request)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  if (isPublicApiPath(pathname)) {
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

      if (isDemoWriteBlocked(pathname, request.method, session)) {
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
    "/people",
    "/friends",
    "/groups",
    "/groups/:path*",
  ],
};
