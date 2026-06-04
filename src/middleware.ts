import { getIronSession } from "iron-session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getIronSessionOptions,
  sessionHasAccessToken,
  type AppSession,
} from "@/lib/session-config";

const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/auth/splitwise",
  "/api/auth/splitwise/callback",
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
      if (!sessionHasAccessToken(session)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      return response;
    }

    if (isProtectedPage(pathname) && !sessionHasAccessToken(session)) {
      const settings = new URL("/settings", request.url);
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
