import { demoListExpenses } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { createExpense } from "@/lib/expenses/create";
import { parseExpenseFilters } from "@/lib/expenses/filters";
import { parseExpenseWriteBody } from "@/lib/expenses/request-body";
import { listExpenses } from "@/lib/expenses/queries";
import { domainErrorResponse, routeErrorResponse } from "@/lib/http-errors";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const filters = parseExpenseFilters(request.nextUrl.searchParams);
  if (await isFakeDataRequest()) {
    return NextResponse.json(demoListExpenses(filters));
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const result = await listExpenses(filters);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseExpenseWriteBody(body as Record<string, unknown>);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await createExpense(parsed.input);

    if ("error" in result && !("ok" in result)) {
      return domainErrorResponse(result);
    }

    return NextResponse.json(result);
  } catch (err) {
    return routeErrorResponse(err, "create_failed");
  }
}
