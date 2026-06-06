import { demoCurrentUserId, demoGroupMembers } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { isDatabaseConfigured } from "@/lib/db";
import { fetchGroupMembers } from "@/lib/groups/members";
import {
  domainErrorResponse,
  jsonError,
  routeErrorResponse,
} from "@/lib/http-errors";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const groupId = Number(id);
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return jsonError("invalid_group", { status: 400 });
  }

  if (await isFakeDataRequest()) {
    const members = demoGroupMembers(groupId);
    if (!members) {
      return jsonError("invalid_group", { status: 404 });
    }
    return NextResponse.json({
      members,
      currentUserId: demoCurrentUserId,
    });
  }

  if (!isDatabaseConfigured()) {
    return jsonError("database_not_configured", { status: 503 });
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return jsonError("not_connected", { status: 401 });
  }

  try {
    const members = await fetchGroupMembers(groupId);
    if ("error" in members) {
      return domainErrorResponse(members);
    }

    return NextResponse.json({
      members,
      currentUserId: owner.splitwiseId,
    });
  } catch (err) {
    return routeErrorResponse(err, "request_failed");
  }
}
