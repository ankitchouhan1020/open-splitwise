import { isFakeDataRequest } from "@/lib/demo/session";
import { getExpenseSuggestions } from "@/lib/expenses/suggestions";
import { NextResponse } from "next/server";

export async function GET() {
  if (await isFakeDataRequest()) {
    return NextResponse.json({ groups: [], recentDescriptions: [] });
  }

  const suggestions = await getExpenseSuggestions();
  if (!suggestions) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }
  return NextResponse.json(suggestions);
}
