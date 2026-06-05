import type { ExpenseListItem } from "@/lib/expenses/types";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";

const EPS = 0.005;

function youPaid(expense: Pick<ExpenseListItem, "myPaidShare">): boolean {
  return Number(expense.myPaidShare ?? 0) > EPS;
}

function payerName(expense: ExpenseListItem): string | null {
  return expense.paidBy !== "—" ? expense.paidBy : null;
}

function payeeName(expense: ExpenseListItem): string | null {
  return expense.paidTo !== "—" ? expense.paidTo : null;
}

/** Who paid whom on a settlement (e.g. "Jordan paid you", "You paid Sam"). */
export function expenseSettlementDirection(
  expense: ExpenseListItem,
): string | null {
  const payer = payerName(expense);
  const payee = payeeName(expense);

  if (isUserInvolvedInExpense(expense) && youPaid(expense) && payee) {
    return `You paid ${payee}`;
  }
  if (isUserInvolvedInExpense(expense) && !youPaid(expense) && payer) {
    return `${payer} paid you`;
  }
  if (payer && payee && payer !== payee) {
    return `${payer} paid ${payee}`;
  }
  if (payer) return `${payer} paid`;
  return null;
}

/** Primary activity line for list rows (article-style consistent verbs). */
export function expenseActivityHeadline(expense: ExpenseListItem): string {
  if (expense.payment) {
    return expenseSettlementDirection(expense) ?? "Settlement";
  }

  const payer = payerName(expense);
  if (!payer) return expense.description;

  if (isUserInvolvedInExpense(expense) && youPaid(expense)) return "You paid";
  if (isUserInvolvedInExpense(expense)) return `${payer} paid`;
  return `${payer} added`;
}

/** Secondary line: group + description context. */
export function expenseActivitySubline(expense: ExpenseListItem): string {
  const parts: string[] = [];

  if (expense.description) {
    parts.push(expense.description);
  }
  if (expense.groupName && expense.groupName !== "No group") {
    parts.push(expense.groupName);
  }

  return parts.join(" · ");
}
