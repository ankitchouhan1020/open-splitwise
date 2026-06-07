"use client";

import { ExpenseCategoryIcon } from "@/components/expense-category-icon";
import { IconCheck } from "@/components/expense-icons";
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

export type ExpenseCategorySuggestion = {
  categoryId: number;
  categoryName: string;
};

type Props = {
  expense: ExpenseListItem;
  searchQuery?: string;
  onSelect?: () => void;
  compact?: boolean;
  selected?: boolean;
  categorySuggestion?: ExpenseCategorySuggestion;
  onApplyCategory?: () => void;
  applyingCategory?: boolean;
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

function CategorySuggestionChip({
  suggestion,
  applying,
  onApply,
}: {
  suggestion: ExpenseCategorySuggestion;
  applying: boolean;
  onApply: () => void;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="text-muted text-[11px]">Suggest</span>
      <span className="bg-pill-active text-pill-active-fg rounded-md px-2 py-0.5 text-[11px] font-medium">
        {suggestion.categoryName}
      </span>
      <button
        type="button"
        disabled={applying}
        onClick={(event) => {
          event.stopPropagation();
          onApply();
        }}
        className="border-border bg-card hover:bg-hover inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium disabled:opacity-60"
        aria-label={`Apply category ${suggestion.categoryName}`}
      >
        {applying ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <IconCheck className="h-3 w-3" />
        )}
        Apply
      </button>
    </div>
  );
}

function ExpenseRowAmountColumn({
  expense,
  balance,
  displayAmount,
}: {
  expense: ExpenseListItem;
  balance: ReturnType<typeof expenseBalanceTag>;
  displayAmount: string;
}) {
  return (
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
  );
}

export function ExpenseListItemRow({
  expense,
  searchQuery = "",
  onSelect,
  compact = false,
  selected = false,
  categorySuggestion,
  onApplyCategory,
  applyingCategory = false,
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

  const rowBase = `border-border border-b text-left transition-colors ${rowTint}`;
  const rowSelected = "bg-balance-get-bg/40 ring-accent/25 ring-1 ring-inset";
  const minHeight = compact ? 60 : categorySuggestion ? 88 : 72;

  if (expense.payment) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`${rowBase} ${EXPENSE_ROW_GRID} hover:bg-hover active:bg-active ${selected ? rowSelected : ""}`}
        style={{ minHeight }}
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
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      className={`${rowBase} ${EXPENSE_ROW_GRID} hover:bg-hover active:bg-active cursor-pointer ${selected ? rowSelected : ""}`}
      style={{ minHeight }}
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
        {categorySuggestion && onApplyCategory ? (
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <CategorySuggestionChip
              suggestion={categorySuggestion}
              applying={applyingCategory}
              onApply={onApplyCategory}
            />
          </div>
        ) : null}
      </div>
      <ExpenseRowAmountColumn
        expense={expense}
        balance={balance}
        displayAmount={displayAmount}
      />
    </div>
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
