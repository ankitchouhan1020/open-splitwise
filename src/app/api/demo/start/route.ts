import { isGuestDemoAllowed } from "@/lib/demo/config";
import { getAppSession } from "@/lib/session";
import { sessionHasAccessToken } from "@/lib/session-config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Guest demo: sample data without Splitwise OAuth. */
export async function POST() {
  if (!isGuestDemoAllowed()) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }

  const session = await getAppSession();
  if (sessionHasAccessToken(session)) {
    session.fakeData = true;
    await session.save();
    return NextResponse.json({ ok: true, enabled: true });
  }

  session.accessToken = undefined;
  session.splitwiseUserId = undefined;
  session.oauthState = undefined;
  session.fakeData = true;
  await session.save();

  return NextResponse.json({ ok: true, enabled: true, guest: true });
}
