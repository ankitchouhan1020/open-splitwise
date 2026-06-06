import { demoCurrentUser } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { getAccessToken } from "@/lib/auth";
import { jsonError, routeErrorResponse } from "@/lib/http-errors";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import { NextResponse } from "next/server";

export async function GET() {
  if (await isFakeDataRequest()) {
    return NextResponse.json({ user: demoCurrentUser() });
  }

  const token = await getAccessToken();
  if (!token) {
    return jsonError("not_connected", { status: 401 });
  }

  try {
    const client = createSplitwiseClient(token);
    const data = await client.get("get_current_user");
    return NextResponse.json(data);
  } catch (err) {
    return routeErrorResponse(err, "request_failed");
  }
}
