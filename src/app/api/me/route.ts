import { getAccessToken } from "@/lib/auth";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import { SplitwiseApiError, SplitwiseAuthError } from "@/lib/splitwise/errors";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const client = createSplitwiseClient(token);
    const data = await client.get("get_current_user");
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SplitwiseAuthError) {
      return NextResponse.json(
        { error: "splitwise_auth_required", code: err.code },
        { status: 401 },
      );
    }
    if (err instanceof SplitwiseApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code, status: err.status },
        { status: err.status >= 500 ? 502 : err.status },
      );
    }
    const message = err instanceof Error ? err.message : "splitwise_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
