import { isAiAvailable } from "@/lib/ai/availability";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ available: false });
  }

  if (await isFakeDataRequest()) {
    return NextResponse.json({ available: false });
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return NextResponse.json({ available: false });
  }

  const available = await isAiAvailable(owner.id);
  return NextResponse.json({ available });
}
