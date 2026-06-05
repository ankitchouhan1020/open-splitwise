import { demoListExpenses } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { createGroupExpense } from "@/lib/expenses/create";
import { parseExpenseFilters } from "@/lib/expenses/filters";
import { listExpenses } from "@/lib/expenses/queries";
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

  const data = body as Record<string, unknown>;
  const groupId = Number(data.groupId);
  const description = String(data.description ?? "");
  const cost = String(data.cost ?? "");
  const currencyCode = String(data.currencyCode ?? "");

  if (!Number.isFinite(groupId) || groupId <= 0) {
    return NextResponse.json({ error: "group_required" }, { status: 400 });
  }
  if (!description.trim() || !cost.trim() || !currencyCode.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const participantIds = Array.isArray(data.participantIds)
    ? data.participantIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : undefined;
  const paidByUserId =
    data.paidByUserId != null ? Number(data.paidByUserId) : undefined;

  try {
    const result = await createGroupExpense({
      groupId,
      description,
      cost,
      currencyCode,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      date: data.date ? String(data.date) : undefined,
      details: data.details ? String(data.details) : undefined,
      participantIds,
      paidByUserId:
        paidByUserId != null && Number.isFinite(paidByUserId)
          ? paidByUserId
          : undefined,
    });

    if ("error" in result && !("ok" in result)) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "create_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
