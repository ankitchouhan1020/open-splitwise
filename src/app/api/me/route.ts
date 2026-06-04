import { getAccessToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/splitwise/api";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const data = await getCurrentUser(token);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "splitwise_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
