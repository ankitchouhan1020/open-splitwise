import { isDatabaseConfigured } from "@/lib/db";
import { expensesToCsv, exportFilename } from "@/lib/expenses/csv";
import { parseExpenseFilters } from "@/lib/expenses/filters";
import { listAllExpensesForExport } from "@/lib/expenses/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const filters = parseExpenseFilters(request.nextUrl.searchParams);
  const rows = await listAllExpensesForExport(filters);
  const csv = expensesToCsv(rows);
  const filename = exportFilename(filters);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
