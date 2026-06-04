import { isDatabaseConfigured } from "@/lib/db";
import { clearAccountDataBySplitwiseId } from "@/lib/db/account";
import { getAppSession, clearAppSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getAppSession();
  const splitwiseUserId = session.splitwiseUserId;

  await clearAppSession();

  if (isDatabaseConfigured() && splitwiseUserId) {
    await clearAccountDataBySplitwiseId(splitwiseUserId);
  }

  return NextResponse.json({ ok: true });
}
