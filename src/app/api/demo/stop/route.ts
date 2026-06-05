import { getAppSession, clearAppSession } from "@/lib/session";
import { sessionHasAccessToken } from "@/lib/session-config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** End guest demo, or turn off sample data while staying connected. */
export async function POST() {
  const session = await getAppSession();

  if (sessionHasAccessToken(session)) {
    session.fakeData = false;
    await session.save();
    return NextResponse.json({ ok: true, enabled: false });
  }

  await clearAppSession();
  return NextResponse.json({ ok: true, enabled: false });
}
