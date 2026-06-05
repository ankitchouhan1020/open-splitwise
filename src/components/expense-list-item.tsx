"use client";

import { ExpenseCategoryIcon } from "@/components/expense-category-icon";
import { HighlightText } from "@/components/highlight-text";
import { expenseBalanceTag } from "@/components/expense-row-meta";
import {
  expenseActivityHeadline,
  expenseActivitySubline,
} from "@/lib/expenses/activity-copy";
import { balanceClasses, rowStripeClass } from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";
import type { ExpenseListItem } from "@/lib/expenses/types";

type Props = {
  expense: ExpenseListItem;
  searchQuery?: string;
  onSelect?: () => void;
  compact?: boolean;
  selected?: boolean;
};

/** Grid: mobile drops date column; desktop keeps Splitwise-style date block. */
export const EXPENSE_ROW_GRID =
  "grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-2.5 px-3 py-3 md:grid-cols-[2.75rem_2.5rem_minmax(0,1fr)_auto] md:gap-x-3 md:py-2.5";

function formatShortDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ExpenseDateBlock({ date }: { date: string }) {
  const d = new Date(date);
  const month = d
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase();
  const day = d.getDate();

  return (
    <div className="hidden h-10 w-11 flex-col items-center justify-center text-center md:flex">
      <div className="text-muted text-[10px] leading-none font-semibold tracking-wide">
        {month}
      </div>
      <div className="text-foreground mt-0.5 text-xl leading-none font-normal tabular-nums">
        {day}
      </div>
    </div>
  );
}

function BalanceLine({ expense }: { expense: ExpenseListItem }) {
  if (expense.payment) {
    return (
      <p className="text-balance-get text-right text-xs leading-snug font-medium">
        Settlement
      </p>
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
  selected = false,
}: Props) {
  const involved = isUserInvolvedInExpense(expense);
  const balance = expenseBalanceTag(expense);
  const rowTint = expense.payment
    ? rowStripeClass("you_are_owed")
    : involved && balance
      ? rowStripeClass(balance.tag)
      : involved
        ? rowStripeClass("settled")
        : "";

  const rowInteractive = `border-border ${EXPENSE_ROW_GRID} border-b text-left transition-colors hover:bg-hover active:bg-active`;
  const rowSelected = "bg-balance-get-bg/40 ring-accent/25 ring-1 ring-inset";

  if (expense.payment) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`${rowInteractive} ${rowTint} ${selected ? rowSelected : ""}`}
        style={{ minHeight: compact ? 60 : 72 }}
      >
        <ExpenseDateBlock date={expense.date} />
        <ExpenseCategoryIcon categoryName={null} payment />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm leading-snug font-medium">
            {expenseActivityHeadline(expense)}
          </p>
          <p className="text-muted mt-0.5 truncate text-[11px]">
            <HighlightText
              text={expenseActivitySubline(expense) || expense.description}
              query={searchQuery}
            />
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-0.5 text-right leading-snug">
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {formatMoney(Number(expense.cost), expense.currencyCode)}
          </span>
          <BalanceLine expense={expense} />
        </div>
      </button>
    );
  }

  const headline = expenseActivityHeadline(expense);
  const subline = expenseActivitySubline(expense);
  const displayAmount = balance
    ? formatMoney(balance.amount, expense.currencyCode)
    : formatMoney(
        Number(expense.myShare ?? expense.cost),
        expense.currencyCode,
      );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${rowInteractive} ${rowTint} ${selected ? rowSelected : ""}`}
      style={{ minHeight: compact ? 60 : 72 }}
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
          <HighlightText text={headline} query={searchQuery} />
        </p>
        <p className="text-muted mt-0.5 truncate text-[11px]">
          <HighlightText
            text={subline || expense.description}
            query={searchQuery}
          />
          <span className="md:hidden"> · {formatShortDate(expense.date)}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 text-right leading-snug">
        <span
          className={`text-sm font-semibold tabular-nums ${
            balance ? balanceClasses(balance.tag).amount : "text-foreground"
          }`}
        >
          {displayAmount}
        </span>
        <BalanceLine expense={expense} />
      </div>
    </button>
  );
}

export function ExpenseListMonthHeader({ label }: { label: string }) {
  return (
    <div
      className="border-border text-muted bg-header-subtle sticky top-0 z-10 border-b px-4 py-2 text-xs font-semibold tracking-widest"
      style={{ minHeight: 36 }}
    >
      {label}
    </div>
  );
}
