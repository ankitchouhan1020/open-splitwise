import { getExpenseSuggestions } from "@/lib/expenses/suggestions";
import { NextResponse } from "next/server";

export async function GET() {
  const suggestions = await getExpenseSuggestions();
  if (!suggestions) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }
  return NextResponse.json(suggestions);
}
