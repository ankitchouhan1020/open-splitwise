"use client";

import { ExpenseCurrencySelect } from "@/components/expense-group-picker";
import { IconCheck } from "@/components/expense-icons";
import { AddExpenseFormSkeleton } from "@/components/expense-detail-skeleton";
import { useExpenseFormOptions } from "@/components/use-expense-form-options";
import type { ExpenseDetail } from "@/lib/expenses/types";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Props = {
  expense: ExpenseDetail;
  onCancel: () => void;
  onSuccess: () => void;
};

const inputClass =
  "border-border focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2";
const labelClass = "text-foreground text-sm font-medium";

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function EditExpenseForm({ expense, onCancel, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { loading, categories, currencies, suggestions } =
    useExpenseFormOptions();

  const [description, setDescription] = useState(expense.description);
  const [cost, setCost] = useState(expense.cost);
  const [currencyCode, setCurrencyCode] = useState(expense.currencyCode);
  const [categoryId, setCategoryId] = useState(
    expense.categoryId ? String(expense.categoryId) : "",
  );
  const [date, setDate] = useState(toDateTimeLocal(expense.date));
  const [details, setDetails] = useState(expense.details ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topCategories = useMemo(() => {
    const seen = new Set<number>();
    const out: { id: number; name: string }[] = [];
    for (const c of [...(suggestions?.categories ?? []), ...categories]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      if (out.length >= 8) break;
    }
    return out;
  }, [suggestions?.categories, categories]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          cost,
          currencyCode,
          categoryId: categoryId ? Number(categoryId) : undefined,
          date: date ? new Date(date).toISOString() : undefined,
          details: details || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        details?: Record<string, string[]>;
      };
      if (!res.ok) {
        const detailText = data.details
          ? Object.entries(data.details)
              .map(([k, v]) => `${k}: ${v.join(", ")}`)
              .join("; ")
          : "";
        setError(
          `${data.error ?? "Could not update expense"}${detailText ? ` — ${detailText}` : ""}`,
        );
        return;
      }
      await invalidateExpenseCaches(queryClient);
      onSuccess();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <AddExpenseFormSkeleton />;
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div>
        <p className="text-muted text-xs font-medium tracking-wide uppercase">
          Group
        </p>
        <p className="mt-1 text-sm font-medium">{expense.groupName}</p>
      </div>

      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-expense-cost" className={labelClass}>
            Amount
          </label>
          <input
            id="edit-expense-cost"
            required
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={`${inputClass} text-lg font-semibold tabular-nums`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-expense-currency" className={labelClass}>
            Currency
          </label>
          <ExpenseCurrencySelect
            currencies={
              currencies.includes(expense.currencyCode)
                ? currencies
                : [expense.currencyCode, ...currencies]
            }
            currencyCode={currencyCode}
            onChange={setCurrencyCode}
            compact
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-expense-desc" className={labelClass}>
          Description
        </label>
        <input
          id="edit-expense-desc"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      {topCategories.length > 0 && (
        <div className="space-y-2">
          <span className={labelClass}>
            Category <span className="text-muted font-normal">(optional)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId("")}
              className={
                !categoryId
                  ? "rounded-md bg-stone-800 px-2.5 py-1 text-xs font-medium text-white"
                  : "border-border rounded-md border bg-white px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
              }
            >
              None
            </button>
            {topCategories.map((c) => {
              const active = categoryId === String(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(active ? "" : String(c.id))}
                  className={
                    active
                      ? "rounded-md bg-stone-800 px-2.5 py-1 text-xs font-medium text-white"
                      : "border-border rounded-md border bg-white px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-expense-date" className={labelClass}>
            Date
          </label>
          <input
            id="edit-expense-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="edit-expense-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="edit-expense-notes"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <IconCheck className="h-4 w-4" />
          {submitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted hover:text-foreground px-3 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
      <p className="text-muted text-xs">
        Split equally · custom splits stay in Splitwise.
      </p>
    </form>
  );
}
