import { isDatabaseConfigured } from "@/lib/db";
import { getExpenseDetail } from "@/lib/expenses/queries";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const expenseId = Number(id);
  if (!Number.isFinite(expenseId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const detail = await getExpenseDetail(expenseId);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
