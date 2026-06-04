"use client";

import { ExpenseCategoryIcon } from "@/components/expense-category-icon";
import { HighlightText } from "@/components/highlight-text";
import { expenseBalanceTag } from "@/components/expense-row-meta";
import { balanceClasses } from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";
import type { ExpenseListItem } from "@/lib/expenses/types";

type Props = {
  expense: ExpenseListItem;
  searchQuery?: string;
  onSelect?: () => void;
  compact?: boolean;
};

/** Grid columns: date · icon · description · amounts */
export const EXPENSE_ROW_GRID =
  "grid w-full grid-cols-[2.75rem_2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2.5";

function ExpenseDateBlock({ date }: { date: string }) {
  const d = new Date(date);
  const month = d
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase();
  const day = d.getDate();

  return (
    <div className="flex h-10 w-11 flex-col items-center justify-center text-center">
      <div className="text-muted text-[10px] leading-none font-semibold tracking-wide">
        {month}
      </div>
      <div className="text-foreground mt-0.5 text-xl leading-none font-normal tabular-nums">
        {day}
      </div>
    </div>
  );
}

function PaidLine({ expense }: { expense: ExpenseListItem }) {
  const total = formatMoney(Number(expense.cost), expense.currencyCode);
  const payer = expense.paidBy !== "—" ? expense.paidBy : null;

  if (expense.payment) {
    return (
      <p className="text-foreground text-right text-sm leading-snug font-medium">
        {expense.description}
      </p>
    );
  }

  return (
    <p className="text-muted text-right text-sm leading-snug">
      {payer ? (
        <>
          <span className="text-foreground/80">{payer}</span> paid{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {total}
          </span>
        </>
      ) : (
        <span className="text-foreground font-semibold tabular-nums">
          {total}
        </span>
      )}
    </p>
  );
}

function BalanceLine({ expense }: { expense: ExpenseListItem }) {
  if (expense.payment) {
    return (
      <p className="text-right text-xs font-medium text-teal-700">Settlement</p>
    );
  }

  if (!isUserInvolvedInExpense(expense)) {
    return (
      <p className="not-involved-stripe text-muted rounded px-2 py-0.5 text-right text-[11px] font-medium">
        not involved
      </p>
    );
  }

  const balance = expenseBalanceTag(expense);
  if (!balance) {
    return (
      <p className="text-muted text-right text-xs leading-snug">settled up</p>
    );
  }

  const styles = balanceClasses(balance.tag);
  const amount = formatMoney(balance.amount, expense.currencyCode);
  const payer = expense.paidBy !== "—" ? expense.paidBy : null;

  if (balance.tag === "you_owe" && payer) {
    return (
      <p className={`text-right text-xs leading-snug ${styles.label}`}>
        {payer} lent you{" "}
        <span className={`font-semibold tabular-nums ${styles.amount}`}>
          {amount}
        </span>
      </p>
    );
  }

  if (balance.tag === "you_are_owed") {
    return (
      <p className={`text-right text-xs leading-snug ${styles.label}`}>
        you lent{" "}
        <span className={`font-semibold tabular-nums ${styles.amount}`}>
          {amount}
        </span>
      </p>
    );
  }

  return (
    <p className={`text-right text-xs leading-snug ${styles.label}`}>
      you owe{" "}
      <span className={`font-semibold tabular-nums ${styles.amount}`}>
        {amount}
      </span>
    </p>
  );
}

export function ExpenseListItemRow({
  expense,
  searchQuery = "",
  onSelect,
  compact = false,
}: Props) {
  const involved = isUserInvolvedInExpense(expense);
  const balance = expenseBalanceTag(expense);
  const rowTint =
    involved && balance
      ? balanceClasses(balance.tag).rowStripe
      : expense.payment
        ? "border-l-2 border-l-teal-500"
        : "";

  if (expense.payment) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`border-border ${EXPENSE_ROW_GRID} border-b text-left transition-colors hover:bg-stone-50/80 ${rowTint}`}
        style={{ minHeight: compact ? 64 : 76 }}
      >
        <ExpenseDateBlock date={expense.date} />
        <ExpenseCategoryIcon categoryName={null} payment />
        <span className="text-foreground min-w-0 truncate text-sm leading-snug font-medium">
          <HighlightText text={expense.description} query={searchQuery} />
        </span>
        <span className="text-foreground text-right text-sm leading-snug font-semibold tabular-nums">
          {formatMoney(Number(expense.cost), expense.currencyCode)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`border-border ${EXPENSE_ROW_GRID} border-b text-left transition-colors hover:bg-stone-50/80 ${rowTint}`}
      style={{ minHeight: compact ? 64 : 76 }}
    >
      <ExpenseDateBlock date={expense.date} />
      <ExpenseCategoryIcon
        categoryId={expense.categoryId}
        categoryName={expense.categoryName}
        categoryIconUrl={expense.categoryIconUrl}
        categoryIconBg={expense.categoryIconBg}
        payment={false}
      />
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm leading-snug font-medium">
          <HighlightText text={expense.description} query={searchQuery} />
        </p>
        {expense.groupName && (
          <span className="text-muted mt-1 inline-block max-w-full truncate rounded bg-stone-100 px-1.5 py-0.5 text-[11px] leading-none">
            {expense.groupName}
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 text-right leading-snug">
        <PaidLine expense={expense} />
        <BalanceLine expense={expense} />
      </div>
    </button>
  );
}

export function ExpenseListMonthHeader({ label }: { label: string }) {
  return (
    <div
      className="border-border text-muted sticky top-0 z-10 border-b bg-stone-100/90 px-4 py-2 text-xs font-semibold tracking-widest"
      style={{ minHeight: 36 }}
    >
      {label}
    </div>
  );
}
