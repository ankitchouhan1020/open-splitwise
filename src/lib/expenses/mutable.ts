import type { ExpenseDetail, ExpenseListItem } from "@/lib/expenses/types";

type MutableExpense = Pick<
  ExpenseListItem | ExpenseDetail,
  "payment" | "groupId"
>;

/** Group expenses (not payments) can be edited/deleted via Splitwise API. */
export function isExpenseMutable(expense: MutableExpense): boolean {
  return !expense.payment && Boolean(expense.groupId && expense.groupId > 0);
}
