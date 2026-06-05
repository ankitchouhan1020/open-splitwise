import { demoExpenseSummary } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { parseExpenseFilters } from "@/lib/expenses/filters";
import { getExpenseSummary } from "@/lib/expenses/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const filters = parseExpenseFilters(request.nextUrl.searchParams);
  if (await isFakeDataRequest()) {
    return NextResponse.json(demoExpenseSummary(filters));
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const summary = await getExpenseSummary(filters);
  return NextResponse.json(summary);
}
