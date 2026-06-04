import { isDatabaseConfigured } from "@/lib/db";
import { getAccountOwner } from "@/lib/db/account";
import { getExpenseSyncStatus } from "@/lib/sync/expenses";
import { isExpenseSyncInProgress } from "@/lib/sync/lock";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const owner = await getAccountOwner();
  if (!owner) {
    return NextResponse.json({
      configured: true,
      connected: false,
    });
  }

  const expenses = await getExpenseSyncStatus(owner.id);

  return NextResponse.json({
    configured: true,
    connected: true,
    inProgress: isExpenseSyncInProgress(),
    expenses,
  });
}
