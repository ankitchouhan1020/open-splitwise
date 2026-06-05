import { getAppSession } from "@/lib/session";
import { sessionHasAccessToken } from "@/lib/session-config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Flip sample-data overlay; keeps Splitwise OAuth session intact. */
export async function POST() {
  const session = await getAppSession();
  if (!sessionHasAccessToken(session)) {
    return NextResponse.json({ error: "connect_required" }, { status: 401 });
  }

  session.fakeData = !session.fakeData;
  await session.save();

  return NextResponse.json({ ok: true, enabled: Boolean(session.fakeData) });
}
