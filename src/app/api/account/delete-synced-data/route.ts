import { isDatabaseConfigured } from "@/lib/db";
import {
  clearAccountData,
  getAuthenticatedAccount,
} from "@/lib/db/account";
import { NextResponse } from "next/server";

/** Removes synced Postgres rows for the current Splitwise user; does not clear the session. */
export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const account = await getAuthenticatedAccount();
  if (!account) {
    return NextResponse.json(
      {
        error: "account_not_found",
        message: "Connect Splitwise to identify which data to delete",
      },
      { status: 400 },
    );
  }

  await clearAccountData(account.id);

  return NextResponse.json({ ok: true, deleted: true });
}
