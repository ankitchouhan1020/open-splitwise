import { aiErrorResponse, requireAiAccount } from "@/lib/ai/guard";
import {
  generateDashboardNarrative,
  getCachedDashboardNarrative,
} from "@/lib/ai/narrative";
import { getDashboardSummary } from "@/lib/expenses/dashboard";
import { NextRequest, NextResponse } from "next/server";

async function loadSummary() {
  const auth = await requireAiAccount();
  if ("error" in auth) return { error: auth.error };

  const summary = await getDashboardSummary();
  if (!summary) {
    return {
      error: NextResponse.json({ error: "not_connected" }, { status: 401 }),
    };
  }

  return { auth, summary };
}

/** Returns a cached summary only — never calls the LLM. */
export async function GET() {
  const loaded = await loadSummary();
  if ("error" in loaded) return loaded.error;

  const narrative = await getCachedDashboardNarrative(
    loaded.auth.owner.id,
    loaded.summary,
  );
  return NextResponse.json({ narrative });
}

export async function POST(request: NextRequest) {
  const loaded = await loadSummary();
  if ("error" in loaded) return loaded.error;

  let refresh = false;
  try {
    const body = (await request.json()) as { refresh?: boolean };
    refresh = body.refresh === true;
  } catch {
    /* empty body is fine */
  }

  try {
    const narrative = await generateDashboardNarrative(
      loaded.auth.owner.id,
      loaded.summary,
      { refresh },
    );
    return NextResponse.json({ narrative });
  } catch (err) {
    if (err instanceof Error && err.message === "narrative_insufficient_data") {
      return NextResponse.json(
        { error: "narrative_insufficient_data" },
        { status: 422 },
      );
    }
    return aiErrorResponse(err);
  }
}
