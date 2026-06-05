import { demoFriendSummary, demoFriendsBalancePage } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { getFriendSummary } from "@/lib/expenses/insights";
import { mergeFriendSyncedStats } from "@/lib/friends/enrich-balances";
import { getFriendsBalancePage } from "@/lib/splitwise/balances";
import { NextResponse } from "next/server";

export async function GET() {
  if (await isFakeDataRequest()) {
    const page = demoFriendsBalancePage();
    const stats = demoFriendSummary({ currency: page.currency });
    return NextResponse.json(mergeFriendSyncedStats(page, stats));
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

  const stats = await getFriendSummary({
    currency: owner.defaultCurrency,
    excludePayments: false,
  });

  return NextResponse.json(mergeFriendSyncedStats(page, stats));
}
