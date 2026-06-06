import { aiErrorResponse, requireAiAccount } from "@/lib/ai/guard";
import { generateDashboardNarrative } from "@/lib/ai/narrative";
import { getDashboardSummary } from "@/lib/expenses/dashboard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAiAccount();
  if ("error" in auth) return auth.error;

  const summary = await getDashboardSummary();
  if (!summary) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const narrative = await generateDashboardNarrative(auth.owner.id, summary);
    return NextResponse.json({ narrative });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
