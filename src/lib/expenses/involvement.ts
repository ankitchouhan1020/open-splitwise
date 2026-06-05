import type { ExpenseListItem } from "@/lib/expenses/types";

/** User has an expense_shares row (participant on the split). */
export function isUserInvolvedInExpense(
  expense: Pick<ExpenseListItem, "myShare" | "myPaidShare">,
): boolean {
  return expense.myShare != null || expense.myPaidShare != null;
}
