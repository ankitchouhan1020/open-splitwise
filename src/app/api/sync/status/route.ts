import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { getDb, schema } from "@/lib/db";
import { getExpenseSyncStatus } from "@/lib/sync/expenses";
import { isAnySyncInProgress } from "@/lib/sync/lock";
import { isSyncActive } from "@/lib/sync/active";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const owner = await getAuthenticatedAccountOwner();
  if (!owner) {
    return NextResponse.json({
      configured: true,
      connected: false,
    });
  }

  const expenses = await getExpenseSyncStatus(owner.id);

  const [state] = await getDb()
    .select({
      groupsLastSyncAt: schema.syncState.groupsLastSyncAt,
      friendsLastSyncAt: schema.syncState.friendsLastSyncAt,
      categoriesLastSyncAt: schema.syncState.categoriesLastSyncAt,
    })
    .from(schema.syncState)
    .where(eq(schema.syncState.accountUserId, owner.id))
    .limit(1);

  return NextResponse.json({
    configured: true,
    connected: true,
    inProgress: isSyncActive({
      lockHeld: isAnySyncInProgress(),
      expensesStatus: expenses.status,
      progress: expenses.progress,
    }),
    expenses: {
      status: expenses.status,
      lastSyncAt: expenses.lastSyncAt?.toISOString() ?? null,
      expenseCount: expenses.expenseCount,
      error: expenses.error,
    },
    progress: expenses.progress,
    metadata: {
      groupsLastSyncAt: state?.groupsLastSyncAt?.toISOString() ?? null,
      friendsLastSyncAt: state?.friendsLastSyncAt?.toISOString() ?? null,
      categoriesLastSyncAt: state?.categoriesLastSyncAt?.toISOString() ?? null,
    },
  });
}
