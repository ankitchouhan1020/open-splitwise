import { isDatabaseConfigured } from "@/lib/db";
import { filtersFromJson } from "@/lib/expenses/filters";
import { deleteSavedView, updateSavedView } from "@/lib/expenses/saved-views";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const viewId = Number(id);
  if (!Number.isFinite(viewId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    filters?: unknown;
  };

  const result = await updateSavedView(viewId, {
    name: body.name,
    filters: body.filters ? filtersFromJson(body.filters) : undefined,
  });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const viewId = Number(id);
  if (!Number.isFinite(viewId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const result = await deleteSavedView(viewId);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
