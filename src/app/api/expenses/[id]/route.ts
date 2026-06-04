import { isDatabaseConfigured } from "@/lib/db";
import { deleteGroupExpense, updateGroupExpense } from "@/lib/expenses/update";
import { getExpenseDetail } from "@/lib/expenses/queries";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function parseExpenseId(id: string): number | null {
  const expenseId = Number(id);
  return Number.isFinite(expenseId) ? expenseId : null;
}

export async function GET(_request: NextRequest, { params }: Params) {
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

  const data = body as Record<string, unknown>;
  const description = String(data.description ?? "");
  const cost = String(data.cost ?? "");
  const currencyCode = String(data.currencyCode ?? "");

  if (!description.trim() || !cost.trim() || !currencyCode.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    const result = await updateGroupExpense(expenseId, {
      description,
      cost,
      currencyCode,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      date: data.date ? String(data.date) : undefined,
      details: data.details ? String(data.details) : undefined,
    });

    if ("error" in result && !("ok" in result)) {
      const status = result.error === "not_found" ? 404 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "update_failed";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const result = await deleteGroupExpense(expenseId);
    if ("error" in result && !("ok" in result)) {
      const status = result.error === "not_found" ? 404 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "delete_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
