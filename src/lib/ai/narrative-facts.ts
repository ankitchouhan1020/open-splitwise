import type { DashboardSummary } from "@/lib/expenses/dashboard";
import { formatMoney } from "@/lib/format";

export type NarrativeFact = {
  id: string;
  text: string;
  priority: number;
};

export type CategoryPeriodRow = {
  categoryId: number | null;
  categoryName: string;
  total: string;
};

function fmt(amount: number, currency: string): string {
  return formatMoney(amount, currency);
}

function addCategoryMomFacts(
  facts: NarrativeFact[],
  summary: DashboardSummary,
  lastMonthCategories: CategoryPeriodRow[],
): void {
  const thisMonthTop = summary.topCategories[0];
  const lastMonthTop = lastMonthCategories[0];
  if (!thisMonthTop || !lastMonthTop) return;

  const { currency } = summary;

  if (
    thisMonthTop.categoryId != null &&
    lastMonthTop.categoryId != null &&
    thisMonthTop.categoryId !== lastMonthTop.categoryId
  ) {
    facts.push({
      id: "category-leader-changed",
      priority: 9,
      text: `${thisMonthTop.categoryName} leads this month; last month ${lastMonthTop.categoryName} was on top.`,
    });
  }

  for (const category of summary.topCategories.slice(0, 3)) {
    const last = lastMonthCategories.find(
      (row) => row.categoryId === category.categoryId,
    );
    if (!last) continue;

    const thisTotal = Number(category.total);
    const lastTotal = Number(last.total);
    if (lastTotal <= 0 || thisTotal <= 0) continue;

    const changePct = ((thisTotal - lastTotal) / lastTotal) * 100;
    if (Math.abs(changePct) < 25) continue;

    facts.push({
      id: `category-mom-${category.categoryId ?? category.categoryName}`,
      priority: 8,
      text: `${category.categoryName} is ${changePct > 0 ? "up" : "down"} ${Math.abs(changePct).toFixed(0)}% vs last month (${fmt(thisTotal, currency)} vs ${fmt(lastTotal, currency)}).`,
    });
  }
}

/** Analytical facts not shown on home insight cards. */
export function buildNarrativeFacts(
  summary: DashboardSummary,
  options: {
    now?: Date;
    lastMonthCategories?: CategoryPeriodRow[];
  } = {},
): NarrativeFact[] {
  const now = options.now ?? new Date();
  const facts: NarrativeFact[] = [];
  const { currency } = summary;
  const thisTotal = Number(summary.thisMonth.total);
  const lastTotal = Number(summary.lastMonth.total);

  if (options.lastMonthCategories?.length) {
    addCategoryMomFacts(facts, summary, options.lastMonthCategories);
  }

  if (summary.projectedMonthTotal != null && lastTotal > 0) {
    const projected = summary.projectedMonthTotal;
    const vsLast = ((projected - lastTotal) / lastTotal) * 100;
    if (Math.abs(vsLast) >= 10) {
      facts.push({
        id: "projected-vs-last",
        priority: 8,
        text: `At current pace you'll reach ~${fmt(projected, currency)} vs ${fmt(lastTotal, currency)} for all of last month (${vsLast > 0 ? "+" : ""}${vsLast.toFixed(0)}%).`,
      });
    }
  }

  const [firstCategory, secondCategory] = summary.topCategories;
  if (firstCategory && thisTotal > 0) {
    const sharePct = (Number(firstCategory.total) / thisTotal) * 100;
    if (sharePct >= 45) {
      facts.push({
        id: "category-concentrated",
        priority: 7,
        text: `${firstCategory.categoryName} is ${sharePct.toFixed(0)}% of your share this month.`,
      });
    }
  }

  if (secondCategory && firstCategory && thisTotal > 0) {
    const secondPct = (Number(secondCategory.total) / thisTotal) * 100;
    if (secondPct >= 18) {
      facts.push({
        id: "second-category",
        priority: 6,
        text: `${secondCategory.categoryName} is your #2 category at ${fmt(Number(secondCategory.total), currency)} (${secondPct.toFixed(0)}% of spend).`,
      });
    }
  }

  const spark = summary.monthlySparkline;
  if (spark.length >= 2) {
    const recent = Number(spark[spark.length - 1]?.total ?? 0);
    const previous = Number(spark[spark.length - 2]?.total ?? 0);
    if (previous > 0 && recent > 0) {
      const changePct = ((recent - previous) / previous) * 100;
      if (Math.abs(changePct) >= 12) {
        facts.push({
          id: "month-momentum",
          priority: 7,
          text: `This month (${fmt(recent, currency)}) is ${changePct > 0 ? "up" : "down"} ${Math.abs(changePct).toFixed(0)}% from ${spark[spark.length - 2]?.month} (${fmt(previous, currency)}).`,
        });
      }
    }
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  let lastWeekTotal = 0;
  let earlierTotal = 0;
  for (const expense of summary.recentExpenses) {
    const share = Number(expense.myShare ?? expense.cost);
    if (new Date(expense.date) >= weekAgo) lastWeekTotal += share;
    else earlierTotal += share;
  }

  const dayOfMonth = now.getDate();
  if (dayOfMonth > 7 && lastWeekTotal > 0 && earlierTotal > 0) {
    const daysEarlier = dayOfMonth - 7;
    const weeklyRecent = (lastWeekTotal / 7) * 7;
    const weeklyEarlier = (earlierTotal / daysEarlier) * 7;
    if (weeklyRecent > weeklyEarlier * 1.25) {
      facts.push({
        id: "spending-accelerated",
        priority: 9,
        text: `Spending picked up recently: ~${fmt(weeklyRecent, currency)} in the last 7 days vs ~${fmt(weeklyEarlier, currency)} per week earlier this month.`,
      });
    } else if (weeklyRecent < weeklyEarlier * 0.75) {
      facts.push({
        id: "spending-slowed",
        priority: 9,
        text: `Spending slowed recently: ~${fmt(weeklyRecent, currency)} in the last 7 days vs ~${fmt(weeklyEarlier, currency)} per week earlier this month.`,
      });
    }
  }

  const topGroup = summary.topGroups[0];
  if (topGroup && topGroup.percentOfTotal >= 55) {
    facts.push({
      id: "group-dominates",
      priority: 5,
      text: `${topGroup.groupName} accounts for ${topGroup.percentOfTotal}% of your share (${topGroup.expenseCount} expenses).`,
    });
  }

  const balances = summary.balances;
  if (balances) {
    const topOwed = balances.topOwedToYou[0];
    const topOwe = balances.topYouOwe[0];
    if (topOwed && topOwed.amount >= 15) {
      facts.push({
        id: "balance-owed",
        priority: 6,
        text:
          balances.topOwedToYou.length > 1
            ? `${topOwed.name} owes you the most (${fmt(topOwed.amount, currency)}); ${fmt(balances.youAreOwed, currency)} total owed to you.`
            : `${topOwed.name} owes you ${fmt(topOwed.amount, currency)}.`,
      });
    }
    if (topOwe && topOwe.amount >= 15) {
      facts.push({
        id: "balance-owe",
        priority: 6,
        text: `Your largest balance owed is ${fmt(topOwe.amount, currency)} to ${topOwe.name}.`,
      });
    }
  }

  const largestRecent = summary.recentExpenses[0];
  if (largestRecent && thisTotal > 0) {
    const share = Number(largestRecent.myShare ?? largestRecent.cost);
    const sharePct = (share / thisTotal) * 100;
    if (sharePct >= 20) {
      facts.push({
        id: "largest-recent-share",
        priority: 7,
        text: `${largestRecent.description} (${fmt(share, currency)}) alone is ${sharePct.toFixed(0)}% of this month's share so far.`,
      });
    }
  }

  if (summary.lastMonth.expenseCount > 0) {
    const countDelta =
      summary.thisMonth.expenseCount - summary.lastMonth.expenseCount;
    if (Math.abs(countDelta) >= 3) {
      facts.push({
        id: "expense-count",
        priority: 4,
        text: `${summary.thisMonth.expenseCount} expenses logged so far vs ${summary.lastMonth.expenseCount} in all of last month.`,
      });
    }
  }

  const seen = new Set<string>();
  return facts
    .filter((fact) => {
      if (seen.has(fact.id)) return false;
      seen.add(fact.id);
      return true;
    })
    .sort((a, b) => b.priority - a.priority);
}

export function hasUsableNarrativeFacts(facts: NarrativeFact[]): boolean {
  if (facts.length >= 2) return true;
  return facts.length === 1 && facts[0]!.priority >= 7;
}

/** Pick facts for the LLM; rotate on regenerate so output isn't a rephrase. */
export function selectNarrativeFacts(
  facts: NarrativeFact[],
  refresh: boolean,
): NarrativeFact[] {
  if (facts.length === 0) return [];
  if (!refresh) return facts.slice(0, 4);

  if (facts.length <= 2) return facts;

  const offset = Math.min(2, facts.length - 1);
  const rotated = [...facts.slice(offset), ...facts.slice(0, offset)];
  return rotated.slice(0, 4);
}

export function narrativeFactsFingerprint(facts: NarrativeFact[]): string {
  return selectNarrativeFacts(facts, false)
    .map((fact) => fact.id)
    .join(",");
}
