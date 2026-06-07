import { demoExpenseDetail } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { parseExpenseUpdateBody } from "@/lib/expenses/request-body";
import { getExpenseDetail } from "@/lib/expenses/queries";
import { deleteExpense, updateExpense } from "@/lib/expenses/update";
import { domainErrorResponse, routeErrorResponse } from "@/lib/http-errors";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseExpenseId(id: string): number | null {
  const expenseId = Number(id);
  return Number.isFinite(expenseId) ? expenseId : null;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const expenseId = parseExpenseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  if (await isFakeDataRequest()) {
    const detail = demoExpenseDetail(expenseId);
    if (!detail) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const detail = await getExpenseDetail(expenseId);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const expenseId = parseExpenseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseExpenseUpdateBody(body as Record<string, unknown>);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await updateExpense(expenseId, parsed.input);

    if ("error" in result && !("ok" in result)) {
      return domainErrorResponse(result);
    }

    return NextResponse.json(result);
  } catch (err) {
    return routeErrorResponse(err, "update_failed");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const expenseId = parseExpenseId(id);
  if (expenseId === null) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    const result = await deleteExpense(expenseId);
    if ("error" in result && !("ok" in result)) {
      return domainErrorResponse(result);
    }

    return NextResponse.json(result);
  } catch (err) {
    return routeErrorResponse(err, "delete_failed");
  }
}
