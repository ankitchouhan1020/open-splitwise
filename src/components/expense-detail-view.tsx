"use client";

import { ExpenseCategoryIcon } from "@/components/expense-category-icon";
import { expenseBalanceTag } from "@/components/expense-row-meta";
import type { ExpenseDetail } from "@/lib/expenses/types";
import { isUserInvolvedInExpense } from "@/lib/expenses/involvement";
import { balanceClasses, balanceLabel } from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";
import { splitwiseGroupUrl } from "@/lib/splitwise/urls";

function formatExpenseDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function MetaPill({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const className =
    "inline-flex max-w-full items-center truncate rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700";
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:border-teal-300 hover:text-teal-800`}
      >
        {children}
      </a>
    );
  }
  return <span className={className}>{children}</span>;
}

function StatTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-3 shadow-sm">
      <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>
      <div className="text-foreground mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

export function ExpenseDetailView({ expense }: { expense: ExpenseDetail }) {
  const involved = isUserInvolvedInExpense(expense);
  const balance = expenseBalanceTag(expense);
  const balanceStyle = balance ? balanceClasses(balance.tag) : null;
  const settled = involved && !balance;

  return (
    <div className="space-y-5 pb-2">
      <section className="border-border overflow-hidden rounded-2xl border bg-gradient-to-b from-stone-50 to-white shadow-sm">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <ExpenseCategoryIcon
              categoryId={expense.categoryId}
              categoryName={expense.categoryName}
              categoryIconUrl={expense.categoryIconUrl}
              categoryIconBg={expense.categoryIconBg}
              payment={expense.payment}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground text-lg leading-snug font-semibold tracking-tight">
                {expense.description}
              </h3>
              <p className="text-muted mt-1 text-sm">
                {formatExpenseDate(expense.date)}
              </p>
            </div>
          </div>

          <p className="text-foreground mt-5 text-3xl font-semibold tracking-tight tabular-nums">
            {formatMoney(Number(expense.cost), expense.currencyCode)}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {expense.payment && (
              <MetaPill>
                <span className="text-teal-800">Settlement</span>
              </MetaPill>
            )}
            {expense.groupName && expense.groupName !== "No group" && (
              <MetaPill
                href={
                  expense.groupId && expense.groupId > 0
                    ? splitwiseGroupUrl(expense.groupId)
                    : undefined
                }
              >
                {expense.groupName}
              </MetaPill>
            )}
            {expense.categoryName && (
              <MetaPill>{expense.categoryName}</MetaPill>
            )}
          </div>
        </div>

        {involved && (
          <div
            className={`border-t px-4 py-3 ${
              settled
                ? "border-stone-200 bg-stone-50/80"
                : balanceStyle
                  ? balanceStyle.card
                  : "border-stone-200 bg-stone-50/80"
            }`}
          >
            {settled ? (
              <p className="text-muted text-sm font-medium">
                You are settled on this one
              </p>
            ) : balance && balanceStyle ? (
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p
                    className={`text-xs font-semibold tracking-wide uppercase ${balanceStyle.label}`}
                  >
                    {balanceLabel(balance.tag)}
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold tabular-nums ${balanceStyle.amount}`}
                  >
                    {formatMoney(balance.amount, expense.currencyCode)}
                  </p>
                </div>
                <p className="text-muted max-w-[10rem] text-right text-xs leading-snug">
                  {expense.paidBy !== "—"
                    ? `${expense.paidBy} paid`
                    : "Your balance"}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {!involved && (
          <div className="border-border not-involved-stripe border-t px-4 py-3">
            <p className="text-muted text-sm font-medium">
              You are not on this split
            </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Your share">
          {involved ? (
            <span className="text-base font-semibold tabular-nums">
              {formatMoney(Number(expense.myShare ?? 0), expense.currencyCode)}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </StatTile>
        <StatTile label="Paid by">
          <span className="truncate">{expense.paidBy}</span>
        </StatTile>
      </div>

      {expense.details && (
        <section className="border-border rounded-xl border bg-stone-50/60 p-3.5">
          <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">
            Notes
          </p>
          <p className="text-foreground mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
            {expense.details}
          </p>
        </section>
      )}

      {expense.comments && (
        <section className="border-border rounded-xl border bg-stone-50/60 p-3.5">
          <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">
            Comments
          </p>
          <p className="text-foreground mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
            {expense.comments}
          </p>
        </section>
      )}

      {expense.shares.length > 0 && (
        <section>
          <p className="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">
            Split breakdown
          </p>
          <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border bg-white shadow-sm">
            {expense.shares.map((s) => {
              const net = Number(s.netBalance ?? 0);
              const netPositive = net > 0.005;
              const netNegative = net < -0.005;
              return (
                <li
                  key={s.splitwiseUserId}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600"
                    aria-hidden
                  >
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">
                      {s.name}
                    </p>
                    <p className="text-muted mt-0.5 text-xs tabular-nums">
                      Paid{" "}
                      {formatMoney(Number(s.paidShare), expense.currencyCode)}
                      {" · "}
                      Owes{" "}
                      {formatMoney(Number(s.owedShare), expense.currencyCode)}
                    </p>
                  </div>
                  {(netPositive || netNegative) && (
                    <span
                      className={`shrink-0 text-right text-xs font-semibold tabular-nums ${
                        netPositive
                          ? "text-teal-700"
                          : netNegative
                            ? "text-amber-700"
                            : "text-muted"
                      }`}
                    >
                      {netPositive ? "+" : ""}
                      {formatMoney(net, expense.currencyCode)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
