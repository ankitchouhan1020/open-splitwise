"use client";

import {
  ExpenseCurrencySelect,
  ExpenseGroupPicker,
} from "@/components/expense-group-picker";
import { AddExpenseFormSkeleton } from "@/components/expense-detail-skeleton";
import { useExpenseFormOptions } from "@/components/use-expense-form-options";
import { parseBulkExpenseText } from "@/lib/expenses/bulk-parse";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { formatMoney } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type BulkResult = {
  created: number;
  failed: number;
  results: Array<{
    index: number;
    description: string;
    cost: string;
    ok: boolean;
    error?: string;
  }>;
};

type Props = {
  onSuccess?: () => void;
};

const PLACEHOLDER = `Groceries, 45.20
Uber, 12.50
Dinner, 89

Paste from a spreadsheet (description + amount columns) or one per line.`;

export function BulkAddExpenseForm({ onSuccess }: Props) {
  const queryClient = useQueryClient();
  const {
    loading,
    groups,
    currencies,
    suggestions,
    defaultCurrency,
    defaultGroup,
  } = useExpenseFormOptions();

  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  useEffect(() => {
    if (loading) return;
    if (defaultGroup && !groupId) {
      setGroupId(String(defaultGroup.id));
      setGroupName(defaultGroup.name);
    }
    setCurrencyCode(defaultCurrency);
  }, [loading, defaultGroup, defaultCurrency, groupId]);

  const parsed = useMemo(() => parseBulkExpenseText(text), [text]);
  const totalAmount = useMemo(
    () =>
      parsed.rows.reduce((sum, row) => sum + Number.parseFloat(row.cost), 0),
    [parsed.rows],
  );

  async function submit() {
    if (!groupId) {
      setError("Pick a group first.");
      return;
    }
    if (parsed.rows.length === 0) {
      setError("Add at least one valid expense line.");
      return;
    }
    if (parsed.errors.length > 0) {
      setError(
        `Fix ${parsed.errors.length} invalid line(s) before submitting.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(groupId),
          currencyCode,
          items: parsed.rows.map((r) => ({
            description: r.description,
            cost: r.cost,
          })),
        }),
      });
      const data = (await res.json()) as BulkResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create expenses.");
        return;
      }
      await invalidateExpenseCaches(queryClient);
      setResult(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <AddExpenseFormSkeleton />;
  }

  if (result) {
    return (
      <div className="space-y-4 py-2">
        <div
          className={
            result.failed === 0
              ? "rounded-lg border border-teal-200 bg-teal-50 px-4 py-3"
              : "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
          }
        >
          <p className="text-sm font-medium text-stone-900">
            {result.created} added
            {result.failed > 0 ? `, ${result.failed} failed` : ""} in{" "}
            {groupName || "group"}.
          </p>
          <p className="text-muted mt-1 text-xs">
            Split equally for each line.
          </p>
        </div>
        {result.failed > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {result.results
              .filter((r) => !r.ok)
              .map((r) => (
                <li key={r.index} className="text-red-800">
                  {r.description}: {r.error ?? "failed"}
                </li>
              ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setText("");
            }}
            className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add more
          </button>
          <button
            type="button"
            onClick={onSuccess}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ExpenseGroupPicker
        groups={groups}
        topGroups={suggestions?.groups.slice(0, 6) ?? []}
        groupId={groupId}
        onGroupChange={(id, name) => {
          setGroupId(id);
          if (id) setGroupName(name);
        }}
      />

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label className="text-foreground mb-1.5 block text-sm font-medium">
            Currency
          </label>
          <ExpenseCurrencySelect
            currencies={currencies}
            currencyCode={currencyCode}
            onChange={setCurrencyCode}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="bulk-expenses"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          Expenses
        </label>
        <textarea
          id="bulk-expenses"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          className="border-border focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus:ring-2"
        />
        <p className="text-muted mt-1.5 text-xs">
          One per line: <span className="font-mono">description, amount</span>{" "}
          or paste two columns from a spreadsheet.
        </p>
      </div>

      {parsed.rows.length > 0 && (
        <div className="border-border rounded-lg border">
          <div className="border-border flex items-center justify-between border-b px-3 py-2">
            <span className="text-foreground text-xs font-medium">
              Preview · {parsed.rows.length} expense
              {parsed.rows.length === 1 ? "" : "s"}
            </span>
            <span className="text-muted text-xs tabular-nums">
              {formatMoney(totalAmount, currencyCode)} total
            </span>
          </div>
          <ul className="max-h-36 divide-y overflow-y-auto">
            {parsed.rows.map((row) => (
              <li
                key={row.lineNumber}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{row.description}</span>
                <span className="shrink-0 tabular-nums">
                  {formatMoney(Number.parseFloat(row.cost), currencyCode)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {parsed.errors.length > 0 && (
        <ul className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
          {parsed.errors.slice(0, 5).map((e) => (
            <li key={e.lineNumber}>
              Line {e.lineNumber}: {e.message}
            </li>
          ))}
          {parsed.errors.length > 5 && (
            <li>…and {parsed.errors.length - 5} more</li>
          )}
        </ul>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          disabled={
            submitting ||
            !groupId ||
            parsed.rows.length === 0 ||
            parsed.errors.length > 0
          }
          onClick={() => void submit()}
          className="bg-accent rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting
            ? `Adding ${parsed.rows.length}…`
            : parsed.rows.length > 0
              ? `Add ${parsed.rows.length} expenses`
              : "Add expenses"}
        </button>
      </div>
    </div>
  );
}
