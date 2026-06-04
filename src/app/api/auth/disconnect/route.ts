import { clearAppSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  await clearAppSession();
  // US-005+: purge synced expenses from local DB here
  return NextResponse.json({ ok: true });
}
