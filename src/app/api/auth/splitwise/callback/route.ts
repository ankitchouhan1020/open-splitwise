import { isDatabaseConfigured } from "@/lib/db";
import { upsertConnectedUser } from "@/lib/db/account";
import { appPathUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/splitwise/api";
import { requestOriginFromHeaders } from "@/lib/request-origin";
import { exchangeCodeForToken } from "@/lib/splitwise/oauth";
import {
  assertSyncCanStart,
  runSyncJob,
  SyncAlreadyInProgressError,
} from "@/lib/sync/run";
import { getAppSession, rotateAppSession } from "@/lib/session";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const origin = requestOriginFromHeaders(request.headers);
  const settingsUrl = appPathUrl("/settings", origin);

  const session = await getAppSession();

  if (error) {
    session.oauthState = undefined;
    await session.save();
    settingsUrl.searchParams.set("error", error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state) {
    session.oauthState = undefined;
    await session.save();
    settingsUrl.searchParams.set("error", "missing_code_or_state");
    return NextResponse.redirect(settingsUrl);
  }

  const expectedState = session.oauthState;

  if (!expectedState || expectedState !== state) {
    session.oauthState = undefined;
    await session.save();
    settingsUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const token = await exchangeCodeForToken(code, origin);
    const { user } = await getCurrentUser(token.access_token);

    await rotateAppSession({
      accessToken: token.access_token,
      splitwiseUserId: user.id,
    });

    if (isDatabaseConfigured()) {
      const account = await upsertConnectedUser({
        splitwiseId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        defaultCurrency: user.default_currency,
      });
      const scope = "all" as const;
      const ctx = {
        accountUserId: account.id,
        accessToken: token.access_token,
      };
      try {
        await assertSyncCanStart(account.id, scope);
        after(async () => {
          await runSyncJob({ scope, ctx });
        });
      } catch (err) {
        if (!(err instanceof SyncAlreadyInProgressError)) {
          console.error("[oauth] post-connect sync schedule failed:", err);
        }
      }
    }

    settingsUrl.searchParams.set("connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch {
    session.oauthState = undefined;
    await session.save();
    settingsUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(settingsUrl);
  }
}
