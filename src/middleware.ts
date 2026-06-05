import { getIronSession } from "iron-session";
import { appPathUrl } from "@/lib/app-url";
import { requestOriginFromHeaders } from "@/lib/request-origin";
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
  "/api/account/delete-synced-data",
]);

const PROTECTED_PAGE_PREFIXES = ["/explore", "/insights"];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      if (
        sessionShowsFakeData(session) &&
        request.method !== "GET" &&
        !FAKE_DATA_WRITE_ALLOWED.has(pathname)
      ) {
        return NextResponse.json({ error: "fake_data_read_only" }, { status: 403 });
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
  ],
};
