import { getEnvOptional } from "@/lib/env";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import { buildAuthorizeUrl, generateOAuthState } from "@/lib/splitwise/oauth";
import { getAppSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getEnvOptional()) {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  const session = await getAppSession();
  const state = generateOAuthState();
  session.oauthState = state;
  await session.save();

  const origin = requestOriginFromHeaders(request.headers);
  return NextResponse.redirect(buildAuthorizeUrl(state, origin));
}
