import type { ExpenseListItem } from "@/lib/expenses/types";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";
import { balanceClasses, balanceLabel } from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";

export type ExpenseBalanceTag = "you_owe" | "you_are_owed";

const EPS = 0.005;

export function expenseBalanceTag(
  expense: Pick<ExpenseListItem, "myPaidShare" | "myShare" | "payment">,
): { tag: ExpenseBalanceTag; amount: number } | null {
  if (expense.payment || !isUserInvolvedInExpense(expense)) return null;
  const paid = Number(expense.myPaidShare ?? 0);
  const owed = Number(expense.myShare ?? 0);
  const net = paid - owed;
  if (Math.abs(net) < EPS) return null;
  return {
    tag: net > 0 ? "you_are_owed" : "you_owe",
    amount: Math.abs(net),
  };
}

export function ExpenseRowMeta({ expense }: { expense: ExpenseListItem }) {
  const balance = expenseBalanceTag(expense);
  const paidBy = expense.paidBy !== "—" ? expense.paidBy : null;

  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-1">
      {expense.payment && (
        <span className="bg-violet-bg text-violet-text rounded px-1.5 py-0.5 text-[11px] font-medium">
          Settlement
        </span>
      )}
      {balance && (
        <span className={balanceClasses(balance.tag).badge}>
          {balanceLabel(balance.tag)}{" "}
          <span className="font-semibold tabular-nums">
            {formatMoney(balance.amount, expense.currencyCode)}
          </span>
        </span>
      )}
      {!balance && !expense.payment && !isUserInvolvedInExpense(expense) && (
        <span className="text-muted text-[11px] leading-snug">
          Not on this split
        </span>
      )}
      {paidBy && (
        <span className="text-muted text-[11px] leading-snug">
          Paid by {paidBy}
        </span>
      )}
    </span>
  );
}

export function expenseRowBalanceClasses(
  expense: Pick<ExpenseListItem, "myPaidShare" | "myShare" | "payment">,
): { stripe: string; hover: string; amount: string } | null {
  if (!isUserInvolvedInExpense(expense)) return null;
  const balance = expenseBalanceTag(expense);
  if (!balance) return null;
  const c = balanceClasses(balance.tag);
  return {
    stripe: c.rowStripe,
    hover: c.rowHover,
    amount: c.amount,
  };
}
