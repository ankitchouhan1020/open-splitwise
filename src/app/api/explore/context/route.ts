import { getExploreContext } from "@/lib/expenses/explore-context";
import { NextResponse } from "next/server";

export async function GET() {
  const context = await getExploreContext();
  if (!context) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }
  return NextResponse.json(context);
}
