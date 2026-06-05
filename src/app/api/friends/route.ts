import { demoFriendsBalancePage } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { getFriendsBalancePage } from "@/lib/splitwise/balances";
import { NextResponse } from "next/server";

export async function GET() {
  if (await isFakeDataRequest()) {
    return NextResponse.json(demoFriendsBalancePage());
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const page = await getFriendsBalancePage(owner.defaultCurrency);
  if (!page) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  return NextResponse.json(page);
}
