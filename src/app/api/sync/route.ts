import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { syncExpenses } from "@/lib/sync/expenses";
import { syncMetadata } from "@/lib/sync/metadata";
import { SplitwiseApiError, SplitwiseAuthError } from "@/lib/splitwise/errors";
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

    const result: Record<string, unknown> = {};

    if (scope === "all" || scope === "metadata") {
      result.metadata = await syncMetadata();
    }
    if (scope === "all" || scope === "expenses") {
      result.expenses = await syncExpenses();
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
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
    const status = message.includes("already in progress") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
