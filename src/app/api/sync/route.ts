import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { requireAccessToken } from "@/lib/auth";
import {
  assertSyncCanStart,
  runSyncJob,
  SyncAlreadyInProgressError,
} from "@/lib/sync/run";
import { SplitwiseApiError, SplitwiseAuthError } from "@/lib/splitwise/errors";
import { after } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    scope?: "all" | "expenses" | "metadata";
  };
  const scope = body.scope ?? "all";

  try {
    const owner = await getAuthenticatedAccountOwner();
    if (!owner) {
      return NextResponse.json(
        {
          error: "account_not_found",
          message: "Reconnect Splitwise in Settings",
        },
        { status: 400 },
      );
    }

    const accessToken = await requireAccessToken();
    await assertSyncCanStart(owner.id, scope);

    const ctx = { accountUserId: owner.id, accessToken };

    after(async () => {
      await runSyncJob({ scope, ctx });
    });

    return NextResponse.json(
      { ok: true, started: true, scope },
      { status: 202 },
    );
  } catch (err) {
    if (err instanceof SyncAlreadyInProgressError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof SplitwiseAuthError) {
      return NextResponse.json(
        { error: "splitwise_auth_required" },
        { status: 401 },
      );
    }
    if (err instanceof SplitwiseApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "sync_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
