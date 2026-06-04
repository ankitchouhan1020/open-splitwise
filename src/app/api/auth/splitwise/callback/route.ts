import { exchangeCodeForToken } from "@/lib/splitwise/oauth";
import { getCurrentUser } from "@/lib/splitwise/api";
import { getAppSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const settingsUrl = new URL("/settings", request.url);

  if (error) {
    settingsUrl.searchParams.set("error", error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state) {
    settingsUrl.searchParams.set("error", "missing_code_or_state");
    return NextResponse.redirect(settingsUrl);
  }

  const session = await getAppSession();
  const expectedState = session.oauthState;

  if (!expectedState || expectedState !== state) {
    settingsUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const token = await exchangeCodeForToken(code);
    const { user } = await getCurrentUser(token.access_token);

    session.accessToken = token.access_token;
    session.splitwiseUserId = user.id;
    session.oauthState = undefined;
    await session.save();

    settingsUrl.searchParams.set("connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "oauth_failed";
    settingsUrl.searchParams.set("error", message.slice(0, 120));
    return NextResponse.redirect(settingsUrl);
  }
}
