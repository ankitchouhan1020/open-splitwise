"use client";

import { ExpenseCurrencySelect } from "@/components/expense-group-picker";
import {
  defaultExpenseDateTimeLocal,
  expenseAmountHeroClass,
  expenseInputClass,
  expenseLabelClass,
} from "@/components/expense-form-styles";
import type { SettleUpInitial } from "@/components/settle-up-provider";
import { useToast } from "@/components/toast-provider";
import { useDemoMode } from "@/components/demo-mode-provider";
import { friendlyExpenseError } from "@/lib/api-errors";
import { balanceClasses } from "@/lib/balance-style";
import { DEMO_MODE_COPY } from "@/lib/demo/copy";
import { formatMoney } from "@/lib/format";
import { useFilterOptions } from "@/lib/query/hooks";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { ui } from "@/lib/ui-classes";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Props = {
  initial: SettleUpInitial;
  onSuccess: () => void;
};

function formatAmountInput(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return amount.toFixed(2);
}

function balanceSummary(initial: SettleUpInitial): {
  headline: string;
  detail: string;
  tone: "you_owe" | "you_are_owed";
} {
  const amount = formatMoney(initial.amount, initial.currency);
  const groupNote = initial.groupName ? ` in ${initial.groupName}` : "";
  if (initial.direction === "you_pay") {
    return {
      headline: `You owe ${initial.friendName} ${amount}`,
      detail: `Record a payment you made to reduce this balance${groupNote}.`,
      tone: "you_owe",
    };
  }
  return {
    headline: `${initial.friendName} owes you ${amount}`,
    detail: `Record a payment they made to reduce this balance${groupNote}.`,
    tone: "you_are_owed",
  };
}

export function SettleUpForm({ initial, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const demoMode = useDemoMode();
  const optionsQuery = useFilterOptions();
  const summary = useMemo(() => balanceSummary(initial), [initial]);

  const [direction, setDirection] = useState(initial.direction);
  const [cost, setCost] = useState(formatAmountInput(initial.amount));
  const [currencyCode, setCurrencyCode] = useState(initial.currency);
  const [date, setDate] = useState(defaultExpenseDateTimeLocal);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerUserId = optionsQuery.data?.ownerUserId ?? 0;
  const currencies = optionsQuery.data?.currencies ?? [initial.currency];
  const showCurrency = currencies.length > 1;
  const tone = balanceClasses(summary.tone);

  const payerPayee = useMemo(() => {
    if (direction === "you_pay") {
      return { payerUserId: ownerUserId, payeeUserId: initial.friendUserId };
    }
    return { payerUserId: initial.friendUserId, payeeUserId: ownerUserId };
  }, [direction, ownerUserId, initial.friendUserId]);

  const directionLabel =
    direction === "you_pay"
      ? `You paid ${initial.friendName}`
      : `${initial.friendName} paid you`;

  const preview = useMemo(() => {
    const n = Number.parseFloat(cost);
    if (!cost.trim() || Number.isNaN(n) || n <= 0) return null;
    return formatMoney(n, currencyCode);
  }, [cost, currencyCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (demoMode) {
      setError(DEMO_MODE_COPY.addExpense);
      return;
    }
    if (!ownerUserId) {
      setError("Connect Splitwise in Settings to record payments.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendUserId: initial.friendUserId,
          cost,
          currencyCode,
          payerUserId: payerPayee.payerUserId,
          payeeUserId: payerPayee.payeeUserId,
          description: "Payment",
          date: date ? new Date(date).toISOString() : undefined,
          details: details || undefined,
          ...(initial.groupId ? { groupId: initial.groupId } : {}),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        details?: Record<string, string[]>;
      };
      if (!res.ok) {
        setError(
          friendlyExpenseError(
            data.error,
            data.details,
            "Couldn't record the payment. Try again.",
          ),
        );
        return;
      }
      await invalidateExpenseCaches(queryClient);
      showToast(
        preview
          ? `Recorded ${preview} · ${directionLabel}`
          : `Payment recorded · ${directionLabel}`,
      );
      onSuccess();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        <div className="space-y-4">
          <div
            className={`overflow-hidden rounded-xl border px-4 py-4 ${tone.card}`}
          >
            <p
              className={`text-lg font-semibold tracking-tight ${tone.amount}`}
            >
              {summary.headline}
            </p>
            <p className="text-muted mt-2 text-sm leading-relaxed">
              {summary.detail}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className={expenseLabelClass}>Who paid?</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDirection("you_pay")}
                className={
                  direction === "you_pay" ? ui.pillActiveMd : ui.pillMd
                }
              >
                You paid {initial.friendName}
              </button>
              <button
                type="button"
                onClick={() => setDirection("they_pay_you")}
                className={
                  direction === "they_pay_you" ? ui.pillActiveMd : ui.pillMd
                }
              >
                {initial.friendName} paid you
              </button>
            </div>
          </div>

          <section
            aria-labelledby="settle-amount-heading"
            className="border-border bg-muted-surface overflow-hidden rounded-xl border"
          >
            <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
              <h3 id="settle-amount-heading" className="sr-only">
                Payment amount
              </h3>
              <p className="text-muted mb-3 text-xs font-medium tracking-wide uppercase">
                Payment amount
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                {showCurrency ? (
                  <ExpenseCurrencySelect
                    currencies={currencies}
                    currencyCode={currencyCode}
                    onChange={setCurrencyCode}
                    compact
                  />
                ) : (
                  <span className="text-muted shrink-0 text-sm font-medium tabular-nums">
                    {currencyCode}
                  </span>
                )}
                <input
                  required
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className={expenseAmountHeroClass}
                  aria-label="Amount"
                />
              </div>
              {preview ? (
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  Recording {preview} as{" "}
                  <span className="text-foreground font-medium">
                    {directionLabel.toLowerCase()}
                  </span>
                  .
                </p>
              ) : null}
            </div>
          </section>

          <div className="space-y-1.5">
            <label htmlFor="settle-date" className={expenseLabelClass}>
              Date
            </label>
            <input
              id="settle-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={expenseInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settle-notes" className={expenseLabelClass}>
              Notes
            </label>
            <textarea
              id="settle-notes"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Optional"
              className={expenseInputClass}
            />
          </div>
        </div>
      </div>

      <div
        className="border-border bg-card shrink-0 border-t px-4 py-3 sm:px-5"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {error && (
          <p className="bg-error-bg text-error-text mb-2 rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || demoMode}
          className="bg-accent text-accent-foreground flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting && (
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          )}
          {submitting
            ? "Recording…"
            : preview
              ? `Record ${preview}`
              : "Record payment"}
        </button>
      </div>
    </form>
  );
}
