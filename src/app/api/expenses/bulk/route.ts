import { isDatabaseConfigured } from "@/lib/db";
import { createGroupExpensesBulk } from "@/lib/expenses/create";
import { NextRequest, NextResponse } from "next/server";

type BulkItem = { description: string; cost: string };

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
  const currencyCode = String(data.currencyCode ?? "");
  const items = data.items as BulkItem[] | undefined;

  if (!Number.isFinite(groupId) || groupId <= 0) {
    return NextResponse.json({ error: "group_required" }, { status: 400 });
  }
  if (!currencyCode.trim()) {
    return NextResponse.json({ error: "currency_required" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  const normalized = items.map((item) => ({
    description: String(item.description ?? "").trim(),
    cost: String(item.cost ?? "").trim(),
  }));

  if (normalized.some((item) => !item.description || !item.cost)) {
    return NextResponse.json({ error: "invalid_items" }, { status: 400 });
  }

  try {
    const participantIds = Array.isArray(data.participantIds)
      ? data.participantIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      : undefined;
    const paidByUserId =
      data.paidByUserId != null ? Number(data.paidByUserId) : undefined;

    const result = await createGroupExpensesBulk(
      groupId,
      currencyCode,
      normalized,
      {
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        date: data.date ? String(data.date) : undefined,
        participantIds,
        paidByUserId:
          paidByUserId != null && Number.isFinite(paidByUserId)
            ? paidByUserId
            : undefined,
      },
    );

    if ("error" in result && !("ok" in result)) {
      const status = result.error === "batch_too_large" ? 400 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "bulk_create_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
