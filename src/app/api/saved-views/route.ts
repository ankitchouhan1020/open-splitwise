import { isDatabaseConfigured } from "@/lib/db";
import { filtersFromJson } from "@/lib/expenses/filters";
import { createSavedView, listSavedViews } from "@/lib/expenses/saved-views";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }
  const views = await listSavedViews();
  return NextResponse.json({ views });
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    name?: string;
    filters?: unknown;
  };
  const result = await createSavedView(
    body.name ?? "",
    filtersFromJson(body.filters),
  );

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
