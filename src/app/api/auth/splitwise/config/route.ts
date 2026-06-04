import {
  readConfiguredRedirectUri,
  resolveSplitwiseRedirectUri,
} from "@/lib/splitwise/redirect-uri";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import { NextRequest, NextResponse } from "next/server";

/** Public diagnostic: confirms which redirect URI the server will use for OAuth. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = requestOriginFromHeaders(request.headers);
  return NextResponse.json({
    configured: readConfiguredRedirectUri() ?? null,
    effective: resolveSplitwiseRedirectUri(origin),
    requestOrigin: origin,
  });
}
