import type { ExpenseListItem } from "@/lib/expenses/types";

export type ExpenseListSection =
  | { kind: "month"; key: string; label: string }
  | { kind: "expense"; key: number; expense: ExpenseListItem };

export const EXPENSE_LIST_MONTH_HEIGHT = 36;
export const EXPENSE_LIST_ROW_HEIGHT = 76;

export function monthSectionLabel(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString(undefined, { month: "long", year: "numeric" })
    .toUpperCase();
}

export function buildExpenseListSections(
  expenses: ExpenseListItem[],
  groupByMonth = true,
): ExpenseListSection[] {
  if (!groupByMonth) {
    return expenses.map((expense) => ({
      kind: "expense" as const,
      key: expense.id,
      expense,
    }));
  }

  const sections: ExpenseListSection[] = [];
  let lastMonthKey = "";

  for (const expense of expenses) {
    const d = new Date(expense.date);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthKey !== lastMonthKey) {
      sections.push({
        kind: "month",
        key: monthKey,
        label: monthSectionLabel(expense.date),
      });
      lastMonthKey = monthKey;
    }
    sections.push({ kind: "expense", key: expense.id, expense });
  }

  return sections;
}

export function sectionHeight(section: ExpenseListSection): number {
  return section.kind === "month"
    ? EXPENSE_LIST_MONTH_HEIGHT
    : EXPENSE_LIST_ROW_HEIGHT;
}
