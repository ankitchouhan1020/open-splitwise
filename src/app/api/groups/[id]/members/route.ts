import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { isDatabaseConfigured } from "@/lib/db";
import { fetchGroupMembers } from "@/lib/groups/members";
import { SplitwiseApiError, SplitwiseAuthError } from "@/lib/splitwise/errors";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return NextResponse.json({ error: "invalid_group" }, { status: 400 });
  }

  try {
    const members = await fetchGroupMembers(groupId);
    if ("error" in members) {
      return NextResponse.json(members, { status: 400 });
    }

    return NextResponse.json({
      members,
      currentUserId: owner.splitwiseId,
    });
  } catch (err) {
    if (err instanceof SplitwiseAuthError) {
      return NextResponse.json({ error: "not_connected" }, { status: 401 });
    }
    if (err instanceof SplitwiseApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status >= 500 ? 502 : err.status },
      );
    }
    const message = err instanceof Error ? err.message : "fetch_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
