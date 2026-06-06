import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { requireAccessToken } from "@/lib/auth";
import { jsonError, routeErrorResponse } from "@/lib/http-errors";
import { assertSyncCanStart, runSyncJob } from "@/lib/sync/run";
import { after } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return jsonError("database_not_configured", { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    scope?: "all" | "expenses" | "metadata";
  };
  const scope = body.scope ?? "all";

  try {
    const owner = await getAuthenticatedAccountOwner();
    if (!owner) {
      return jsonError("account_not_found", { status: 400 });
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
    return routeErrorResponse(err, "sync_failed");
  }
}
