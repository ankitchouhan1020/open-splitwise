import { clearAppSession } from "@/lib/session";
import { NextResponse } from "next/server";

/** Ends the session only; synced data in Postgres is kept until explicitly deleted. */
export async function POST() {
  await clearAppSession();
  return NextResponse.json({ ok: true });
}
