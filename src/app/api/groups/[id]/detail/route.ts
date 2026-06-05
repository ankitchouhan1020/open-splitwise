import { demoGroupDetail } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { getGroupDetail } from "@/lib/groups/detail";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return NextResponse.json({ error: "invalid_group" }, { status: 400 });
  }

  if (await isFakeDataRequest()) {
    const detail = demoGroupDetail(groupId);
    if (!detail) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  }

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

  const detail = await getGroupDetail(groupId);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
