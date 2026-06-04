"use client";

import { ExpenseDetailSkeleton } from "@/components/expense-detail-skeleton";
import { expenseBalanceTag } from "@/components/expense-row-meta";
import type { ExpenseDetail } from "@/lib/expenses/types";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";
import { balanceClasses, balanceLabel } from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";
import { splitwiseExpenseUrl, splitwiseGroupUrl } from "@/lib/splitwise/urls";
import { useEffect } from "react";

type Props = {
  expense: ExpenseDetail | null;
  loading: boolean;
  onClose: () => void;
};

export function ExpenseDetailDrawer({ expense, loading, onClose }: Props) {
  const open = Boolean(expense) || loading;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const balance = expense ? expenseBalanceTag(expense) : null;
  const balanceStyle = balance ? balanceClasses(balance.tag) : null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="border-border bg-card fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l shadow-xl">
        <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="font-semibold">Expense details</h2>
            {expense?.payment && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                Payment
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground shrink-0 text-sm"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <ExpenseDetailSkeleton />}
          {!loading && expense && (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Description</dt>
                <dd className="font-medium">{expense.description}</dd>
              </div>
              {expense.details && (
                <div>
                  <dt className="text-muted">Notes</dt>
                  <dd>{expense.details}</dd>
                </div>
              )}
              {expense.comments && (
                <div>
                  <dt className="text-muted">Comments</dt>
                  <dd className="whitespace-pre-wrap">{expense.comments}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Date</dt>
                <dd>{new Date(expense.date).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted">Group</dt>
                <dd>
                  {expense.groupId && expense.groupId > 0 ? (
                    <a
                      href={splitwiseGroupUrl(expense.groupId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      {expense.groupName}
                    </a>
                  ) : (
                    expense.groupName
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Category</dt>
                <dd>{expense.categoryName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Total</dt>
                <dd>
                  {formatMoney(Number(expense.cost), expense.currencyCode)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">My share</dt>
                <dd>
                  {isUserInvolvedInExpense(expense) ? (
                    <span
                      className={
                        balanceStyle
                          ? `${balanceStyle.amount} font-semibold tabular-nums`
                          : ""
                      }
                    >
                      {formatMoney(
                        Number(expense.myShare ?? 0),
                        expense.currencyCode,
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">Not on this split</span>
                  )}
                </dd>
              </div>
              {balance && balanceStyle && isUserInvolvedInExpense(expense) && (
                <div
                  className={`rounded-lg border px-3 py-2 ${balanceStyle.card}`}
                >
                  <p className={`text-xs font-medium ${balanceStyle.label}`}>
                    {balanceLabel(balance.tag)}
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-semibold tabular-nums ${balanceStyle.amount}`}
                  >
                    {formatMoney(balance.amount, expense.currencyCode)}
                  </p>
                </div>
              )}
              <div>
                <dt className="text-muted">Paid by</dt>
                <dd>{expense.paidBy}</dd>
              </div>
              {expense.shares.length > 0 && (
                <div>
                  <dt className="text-muted mb-1">Splits</dt>
                  <dd>
                    <ul className="space-y-1">
                      {expense.shares.map((s) => (
                        <li
                          key={s.splitwiseUserId}
                          className="rounded bg-stone-50 px-2 py-1"
                        >
                          {s.name}: paid{" "}
                          {formatMoney(
                            Number(s.paidShare),
                            expense.currencyCode,
                          )}
                          , owed{" "}
                          {formatMoney(
                            Number(s.owedShare),
                            expense.currencyCode,
                          )}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
        {expense && (
          <div className="border-t px-4 py-3">
            <a
              href={splitwiseExpenseUrl(expense.splitwiseId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-sm font-medium underline"
            >
              Open in Splitwise
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
