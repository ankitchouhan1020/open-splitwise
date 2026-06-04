import { isDatabaseConfigured } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { getDashboardSummary } from "@/lib/expenses/dashboard";
import { NextResponse } from "next/server";

export async function GET() {
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

  const summary = await getDashboardSummary();
  if (!summary) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  return NextResponse.json(summary);
}
