import { isDatabaseConfigured } from "@/lib/db";
import { upsertAccountOwner } from "@/lib/db/account";
import { appPathUrl, resolveAppUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/splitwise/api";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import { exchangeCodeForToken } from "@/lib/splitwise/oauth";
import { getAppSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const origin = requestOriginFromHeaders(request.headers);
  const settingsUrl = appPathUrl("/settings", origin);

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
    const token = await exchangeCodeForToken(code, origin);
    const { user } = await getCurrentUser(token.access_token);

    session.accessToken = token.access_token;
    session.splitwiseUserId = user.id;
    session.oauthState = undefined;
    await session.save();

    if (isDatabaseConfigured()) {
      await upsertAccountOwner({
        splitwiseId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        defaultCurrency: user.default_currency,
      });
      // Background sync — do not block redirect
      const base = resolveAppUrl(origin);
      fetch(`${base}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ scope: "all" }),
      }).catch(() => {});
    }

    settingsUrl.searchParams.set("connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "oauth_failed";
    settingsUrl.searchParams.set("error", message.slice(0, 120));
    return NextResponse.redirect(settingsUrl);
  }
}
