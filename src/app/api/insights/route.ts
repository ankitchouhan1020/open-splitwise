import { isDatabaseConfigured } from "@/lib/db";
import {
  getCategoryBreakdown,
  getFriendSummary,
  getGroupSummary,
  getMonthlySpend,
  getPeriodComparison,
  getRangeSummary,
  type InsightsFilters,
} from "@/lib/expenses/insights";
import { NextRequest, NextResponse } from "next/server";

function parseInsightsFilters(
  params: URLSearchParams,
): InsightsFilters & { view?: string } {
  const groupRaw = params.get("group");
  const groupId =
    groupRaw != null && groupRaw !== "" ? Number(groupRaw) : undefined;

  return {
    view: params.get("view") ?? undefined,
    dateFrom: params.get("from") ?? undefined,
    dateTo: params.get("to") ?? undefined,
    groupId: Number.isFinite(groupId) ? groupId : undefined,
    currency: params.get("currency") ?? undefined,
    excludePayments: params.get("payments") !== "include",
  };
}

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "database_not_configured" },
      { status: 503 },
    );
  }

  const filters = parseInsightsFilters(request.nextUrl.searchParams);
  const view = filters.view ?? "dashboard";

  switch (view) {
    case "monthly":
      return NextResponse.json({
        monthly: await getMonthlySpend(filters),
      });
    case "categories":
      return NextResponse.json({
        categories: await getCategoryBreakdown(filters),
      });
    case "trends":
      return NextResponse.json({
        trends: await getPeriodComparison(filters),
      });
    case "groups":
      return NextResponse.json({
        groups: await getGroupSummary(filters),
      });
    case "friends":
      return NextResponse.json({
        friends: await getFriendSummary(filters),
      });
    default:
      return NextResponse.json({
        summary: await getRangeSummary(filters),
        monthly: await getMonthlySpend(filters),
        categories: await getCategoryBreakdown(filters),
        trends: await getPeriodComparison(filters),
        groups: await getGroupSummary(filters),
        friends: await getFriendSummary(filters),
      });
  }
}
