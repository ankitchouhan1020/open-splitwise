import { isProduction } from "@/lib/security/production";
import {
  readConfiguredRedirectUri,
  resolveSplitwiseRedirectUri,
} from "@/lib/splitwise/redirect-uri";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import {
  getIronSessionOptions,
  sessionIsActive,
  type AppSession,
} from "@/lib/session-config";
import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

/** Diagnostic: confirms which redirect URI the server will use for OAuth. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (isProduction()) {
    const response = NextResponse.next();
    const session = await getIronSession<AppSession>(
      request,
      response,
      getIronSessionOptions(),
    );
    if (!sessionIsActive(session)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const origin = requestOriginFromHeaders(request.headers);
  return NextResponse.json({
    configured: readConfiguredRedirectUri() ?? null,
    effective: resolveSplitwiseRedirectUri(origin),
    requestOrigin: origin,
  });
}
