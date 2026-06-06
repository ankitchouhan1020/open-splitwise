import { aiErrorResponse, requireAiAccount } from "@/lib/ai/guard";
import { generateDashboardNarrative } from "@/lib/ai/narrative";
import { getDashboardSummary } from "@/lib/expenses/dashboard";
import { NextRequest, NextResponse } from "next/server";

async function handleNarrative(refresh: boolean) {
  const auth = await requireAiAccount();
  if ("error" in auth) return auth.error;

  const summary = await getDashboardSummary();
  if (!summary) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const narrative = await generateDashboardNarrative(auth.owner.id, summary, {
      refresh,
    });
    return NextResponse.json({ narrative });
  } catch (err) {
    return aiErrorResponse(err);
  }
}

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  return handleNarrative(refresh);
}

export async function POST(request: NextRequest) {
  let refresh = false;
  try {
    const body = (await request.json()) as { refresh?: boolean };
    refresh = body.refresh === true;
  } catch {
    /* empty body is fine */
  }
  return handleNarrative(refresh);
}
