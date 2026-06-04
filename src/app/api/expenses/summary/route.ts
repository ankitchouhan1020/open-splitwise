import { isDatabaseConfigured } from "@/lib/db";
import { parseExpenseFilters } from "@/lib/expenses/filters";
import { getExpenseSummary } from "@/lib/expenses/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const filters = parseExpenseFilters(request.nextUrl.searchParams);
  const summary = await getExpenseSummary(filters);
  return NextResponse.json(summary);
}
