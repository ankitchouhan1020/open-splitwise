import { isDatabaseConfigured } from "@/lib/db";
import {
  listExpenses,
  type ExpenseListOrder,
  type ExpenseListSort,
} from "@/lib/expenses/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "100");
  const sort = (searchParams.get("sort") ?? "date") as ExpenseListSort;
  const order = (searchParams.get("order") ?? "desc") as ExpenseListOrder;

  const validSort = ["date", "cost", "description"].includes(sort)
    ? sort
    : "date";
  const validOrder = order === "asc" ? "asc" : "desc";

  const result = await listExpenses({
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 100,
    sort: validSort,
    order: validOrder,
  });

  return NextResponse.json(result);
}
