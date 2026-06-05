import { demoFilterOptions } from "@/lib/demo/handlers";
import { isFakeDataRequest } from "@/lib/demo/session";
import { isDatabaseConfigured } from "@/lib/db";
import { getFilterOptions } from "@/lib/expenses/queries";
import { NextResponse } from "next/server";

export async function GET() {
  if (await isFakeDataRequest()) {
    return NextResponse.json(demoFilterOptions());
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const options = await getFilterOptions();
  return NextResponse.json(options);
}
