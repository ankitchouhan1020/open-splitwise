import { isDatabaseConfigured } from "@/lib/db";
import { recordSettlement } from "@/lib/expenses/create";
import { parseSettlementWriteBody } from "@/lib/expenses/request-body";
import { domainErrorResponse, routeErrorResponse } from "@/lib/http-errors";
import { NextRequest, NextResponse } from "next/server";

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

  const parsed = parseSettlementWriteBody(body as Record<string, unknown>);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await recordSettlement(parsed.input);

    if ("error" in result && !("ok" in result)) {
      return domainErrorResponse(result);
    }

    return NextResponse.json(result);
  } catch (err) {
    return routeErrorResponse(err, "settlement_failed");
  }
}
