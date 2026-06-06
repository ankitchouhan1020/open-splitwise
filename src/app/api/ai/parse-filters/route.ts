import { aiErrorResponse, requireAiAccount } from "@/lib/ai/guard";
import { parseNaturalLanguageFilters } from "@/lib/ai/parse-filters";
import { parseFiltersRequestSchema } from "@/lib/ai/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requireAiAccount();
  if ("error" in auth) return auth.error;

  const body = parseFiltersRequestSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await parseNaturalLanguageFilters(
      auth.owner.id,
      body.data.query,
    );
    return NextResponse.json(result);
  } catch (err) {
    return aiErrorResponse(err);
  }
}
