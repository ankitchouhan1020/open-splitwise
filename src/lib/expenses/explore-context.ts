import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { getGroupSummary, getCategoryBreakdown } from "@/lib/expenses/insights";

export type ExploreGroupStat = {
  groupId: number;
  groupName: string;
  expenseCount: number;
  myShareTotal: string;
  percentOfTotal: number;
};

export type ExploreContext = {
  groups: ExploreGroupStat[];
  topCategories: Array<{
    categoryId: number | null;
    categoryName: string;
    total: string;
    count: number;
  }>;
};

export async function getExploreContext(): Promise<ExploreContext | null> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return null;

  const base = { excludePayments: true as const };
  const [groups, categories] = await Promise.all([
    getGroupSummary(base),
    getCategoryBreakdown(base, 6),
  ]);

  return {
    groups: groups
      .filter((g) => g.groupId > 0)
      .slice(0, 12)
      .map((g) => ({
        groupId: g.groupId,
        groupName: g.groupName,
        expenseCount: g.expenseCount,
        myShareTotal: g.myShareTotal,
        percentOfTotal: g.percentOfTotal,
      })),
    topCategories: categories,
  };
}
