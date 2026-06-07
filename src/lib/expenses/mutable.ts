import type { ExpenseDetail } from "@/lib/expenses/types";

type MutableExpense = Pick<
  ExpenseDetail,
  "payment" | "groupId" | "friendshipId"
>;

/** Non-payment expenses can be edited/deleted via Splitwise API. */
export function isExpenseMutable(expense: MutableExpense): boolean {
  if (expense.payment) return false;
  const inGroup = Boolean(expense.groupId && expense.groupId > 0);
  const withFriend = Boolean(expense.friendshipId && expense.friendshipId > 0);
  return inGroup || withFriend;
}
