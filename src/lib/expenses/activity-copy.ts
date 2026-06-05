import type { ExpenseListItem } from "@/lib/expenses/types";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";

const EPS = 0.005;

function youPaid(expense: Pick<ExpenseListItem, "myPaidShare">): boolean {
  return Number(expense.myPaidShare ?? 0) > EPS;
}

/** Primary activity line for list rows (article-style consistent verbs). */
export function expenseActivityHeadline(expense: ExpenseListItem): string {
  if (expense.payment) {
    if (isUserInvolvedInExpense(expense) && youPaid(expense)) {
      return "You recorded a payment";
    }
    const payer = expense.paidBy !== "—" ? expense.paidBy : null;
    return payer ? `${payer} recorded a payment` : "Settlement";
  }

  const payer = expense.paidBy !== "—" ? expense.paidBy : null;
  if (!payer) return expense.description;

  if (isUserInvolvedInExpense(expense) && youPaid(expense)) return "You paid";
  if (isUserInvolvedInExpense(expense)) return `${payer} paid`;
  return `${payer} added`;
}

/** Secondary line: group + description context. */
export function expenseActivitySubline(expense: ExpenseListItem): string {
  const parts: string[] = [];
  if (expense.groupName && expense.groupName !== "No group") {
    parts.push(expense.groupName);
  }
  if (!expense.payment && expense.description) {
    parts.push(expense.description);
  }
  return parts.join(" · ");
}
