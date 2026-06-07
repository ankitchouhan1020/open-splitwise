import { demoGroupSettlePage } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getGroupSettlePage } from "@/lib/groups/settle-balances";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return NextResponse.json({ error: "invalid_group" }, { status: 400 });
  }

  if (await isFakeDataRequest()) {
    const page = demoGroupSettlePage(groupId);
    if (!page) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(page);
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const page = await getGroupSettlePage(groupId);
  if (!page) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(page);
}
