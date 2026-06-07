import { aiErrorResponse, requireAiAccount } from "@/lib/ai/guard";
import { suggestExpenseCategories } from "@/lib/ai/suggest-categories";
import { suggestCategoriesRequestSchema } from "@/lib/ai/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requireAiAccount();
  if ("error" in auth) return auth.error;

  const body = suggestCategoriesRequestSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await suggestExpenseCategories(
      auth.owner.id,
      body.data.expenses,
    );
    return NextResponse.json(result);
  } catch (err) {
    return aiErrorResponse(err);
  }
}
