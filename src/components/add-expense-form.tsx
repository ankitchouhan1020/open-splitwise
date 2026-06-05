"use client";

import { ExpenseCurrencySelect } from "@/components/expense-group-picker";
import { ExpenseFormGroupSection } from "@/components/expense-form-group-section";
import {
  defaultExpenseDateTimeLocal,
  expenseInputClass,
  expenseLabelClass,
} from "@/components/expense-form-styles";
import { AddExpenseFormSkeleton } from "@/components/expense-detail-skeleton";
import { useExpenseFormDefaults } from "@/components/use-expense-form-defaults";
import { parseBulkExpenseText } from "@/lib/expenses/bulk-parse";
import { formatMoney } from "@/lib/format";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { splitwiseExpenseUrl } from "@/lib/splitwise/urls";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "single" | "bulk";

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
  autoFocus?: boolean;
};

const BULK_PLACEHOLDER = `Groceries, 45.20
Uber, 12.50
Dinner, 89`;

export function AddExpenseForm({ onSuccess, autoFocus = false }: Props) {
  const queryClient = useQueryClient();
  const form = useExpenseFormDefaults();

  const [mode, setMode] = useState<Mode>("single");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(defaultExpenseDateTimeLocal);
  const [details, setDetails] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleSuccess, setSingleSuccess] = useState<{
    text: string;
    splitwiseId: number;
  } | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!autoFocus || form.loading) return;
    amountRef.current?.focus();
  }, [autoFocus, form.loading]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        mode !== "single" ||
        (e.metaKey || e.ctrlKey) === false ||
        e.key !== "Enter" ||
        submitting ||
        !form.groupId
      ) {
        return;
      }
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, submitting, form.groupId]);

  const topDescriptions = form.suggestions?.descriptions.slice(0, 6) ?? [];
  const topCategories = useMemo(() => {
    const seen = new Set<number>();
    const out: { id: number; name: string }[] = [];
    for (const c of [...(form.suggestions?.categories ?? []), ...form.categories]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      if (out.length >= 6) break;
    }
    return out;
  }, [form.suggestions?.categories, form.categories]);

  const parsedBulk = useMemo(() => parseBulkExpenseText(bulkText), [bulkText]);
  const bulkTotal = useMemo(
    () =>
      parsedBulk.rows.reduce(
        (sum, row) => sum + Number.parseFloat(row.cost),
        0,
      ),
    [parsedBulk.rows],
  );

  function resetSingleForAnother() {
    setDescription("");
    setCost("");
    setDetails("");
    setCategoryId("");
    setDate(defaultExpenseDateTimeLocal());
    setSingleSuccess(null);
    setError(null);
    amountRef.current?.focus();
  }

  function handleGroupChange(id: string, name: string) {
    form.onGroupChange(id, name);
    setError(null);
  }

  async function submitSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!form.groupId) {
      setError("Pick a group first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSingleSuccess(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(form.groupId),
          description,
          cost,
          currencyCode: form.currencyCode,
          categoryId: categoryId ? Number(categoryId) : undefined,
          date: date ? new Date(date).toISOString() : undefined,
          details: details || undefined,
          ...form.splitPayload,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        splitwiseId?: number;
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
          `${data.error ?? "Could not create expense"}${detailText ? ` — ${detailText}` : ""}`,
        );
        return;
      }
      if (data.splitwiseId) {
        await invalidateExpenseCaches(queryClient);
        setSingleSuccess({
          text:
            form.participantIds.length > 0
              ? `Added to ${form.groupName || "group"}.`
              : `Added to ${form.groupName || "group"} — split equally.`,
          splitwiseId: data.splitwiseId,
        });
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBulk() {
    if (!form.groupId) {
      setError("Pick a group first.");
      return;
    }
    if (parsedBulk.rows.length === 0) {
      setError("Add at least one valid expense line.");
      return;
    }
    if (parsedBulk.errors.length > 0) {
      setError(
        `Fix ${parsedBulk.errors.length} invalid line(s) before submitting.`,
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
          groupId: Number(form.groupId),
          currencyCode: form.currencyCode,
          items: parsedBulk.rows.map((r) => ({
            description: r.description,
            cost: r.cost,
          })),
          ...form.splitPayload,
        }),
      });
      const data = (await res.json()) as BulkResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create expenses.");
        return;
      }
      await invalidateExpenseCaches(queryClient);
      setBulkResult(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (form.loading) {
    return <AddExpenseFormSkeleton />;
  }

  if (singleSuccess) {
    return (
      <div className="space-y-4 py-1">
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-sm font-medium text-teal-900">
            {singleSuccess.text}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetSingleForAnother}
            className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add another
          </button>
          <a
            href={splitwiseExpenseUrl(singleSuccess.splitwiseId)}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50"
          >
            Open in Splitwise
          </a>
          <button
            type="button"
            onClick={onSuccess}
            className="text-muted hover:text-foreground px-2 py-2 text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (bulkResult) {
    return (
      <div className="space-y-4 py-1">
        <div
          className={
            bulkResult.failed === 0
              ? "rounded-lg border border-teal-200 bg-teal-50 px-4 py-3"
              : "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
          }
        >
          <p className="text-sm font-medium text-stone-900">
            {bulkResult.created} added
            {bulkResult.failed > 0
              ? `, ${bulkResult.failed} failed`
              : ""} in {form.groupName || "group"}.
          </p>
        </div>
        {bulkResult.failed > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {bulkResult.results
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
              setBulkResult(null);
              setBulkText("");
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

  const groupSection = (
    <ExpenseFormGroupSection
      groups={form.groups}
      topGroups={form.suggestions?.groups.slice(0, 6) ?? []}
      groupId={form.groupId}
      onGroupChange={handleGroupChange}
      participantIds={form.participantIds}
      onParticipantChange={form.setParticipantIds}
      paidByUserId={form.paidByUserId}
      onPaidByChange={form.setPaidByUserId}
    />
  );

  return (
    <div className="space-y-4">
      {groupSection}

      {mode === "single" ? (
        <form
          ref={formRef}
          onSubmit={(e) => void submitSingle(e)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="expense-desc" className={expenseLabelClass}>
              Description
            </label>
            <input
              id="expense-desc"
              required
              placeholder="What was it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={expenseInputClass}
            />
            {topDescriptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topDescriptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDescription(d)}
                    className="border-border text-muted hover:border-accent hover:text-foreground rounded-full border bg-stone-50/80 px-2.5 py-0.5 text-xs hover:bg-white"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-[1fr_5.5rem] gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="expense-cost" className={expenseLabelClass}>
                Amount
              </label>
              <input
                ref={amountRef}
                id="expense-cost"
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={`${expenseInputClass} text-lg font-semibold tabular-nums`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="expense-currency" className={expenseLabelClass}>
                Currency
              </label>
              <ExpenseCurrencySelect
                currencies={form.currencies}
                currencyCode={form.currencyCode}
                onChange={form.setCurrencyCode}
                compact
              />
            </div>
          </div>

          {topCategories.length > 0 && (
            <div className="space-y-2">
              <span className={expenseLabelClass}>
                Category{" "}
                <span className="text-muted font-normal">(optional)</span>
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

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-muted hover:text-foreground text-xs font-medium"
          >
            {showMore ? "Hide" : "Show"} date & notes
          </button>

          {showMore && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="expense-date" className={expenseLabelClass}>
                  Date
                </label>
                <input
                  id="expense-date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={expenseInputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="expense-notes" className={expenseLabelClass}>
                  Notes
                </label>
                <textarea
                  id="expense-notes"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  placeholder="Receipt #, who was there…"
                  className={expenseInputClass}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting || !form.groupId}
              className="bg-accent rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add expense"}
            </button>
            <span className="text-muted text-xs">⌘↵ to save</span>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_5.5rem] gap-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2 sm:grid sm:max-w-xs sm:grid-cols-1">
              <label htmlFor="bulk-currency" className={expenseLabelClass}>
                Currency
              </label>
              <ExpenseCurrencySelect
                currencies={form.currencies}
                currencyCode={form.currencyCode}
                onChange={form.setCurrencyCode}
              />
            </div>
          </div>

          <div>
            <label htmlFor="bulk-expenses" className={expenseLabelClass}>
              Expenses
            </label>
            <textarea
              id="bulk-expenses"
              rows={7}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={BULK_PLACEHOLDER}
              className={`${expenseInputClass} mt-1.5 font-mono leading-relaxed`}
            />
            <p className="text-muted mt-1.5 text-xs">
              One per line:{" "}
              <span className="font-mono">description, amount</span>
            </p>
          </div>

          {parsedBulk.rows.length > 0 && (
            <div className="border-border rounded-lg border">
              <div className="border-border flex items-center justify-between border-b px-3 py-2">
                <span className="text-foreground text-xs font-medium">
                  {parsedBulk.rows.length} expense
                  {parsedBulk.rows.length === 1 ? "" : "s"}
                </span>
                <span className="text-muted text-xs tabular-nums">
                  {formatMoney(bulkTotal, form.currencyCode)} total
                </span>
              </div>
              <ul className="max-h-32 divide-y overflow-y-auto">
                {parsedBulk.rows.map((row) => (
                  <li
                    key={row.lineNumber}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">{row.description}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatMoney(
                        Number.parseFloat(row.cost),
                        form.currencyCode,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedBulk.errors.length > 0 && (
            <ul className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
              {parsedBulk.errors.slice(0, 5).map((e) => (
                <li key={e.lineNumber}>
                  Line {e.lineNumber}: {e.message}
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={
              submitting ||
              !form.groupId ||
              parsedBulk.rows.length === 0 ||
              parsedBulk.errors.length > 0
            }
            onClick={() => void submitBulk()}
            className="bg-accent rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? `Adding ${parsedBulk.rows.length}…`
              : parsedBulk.rows.length > 0
                ? `Add ${parsedBulk.rows.length} expenses`
                : "Add expenses"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "single" ? "bulk" : "single");
          setError(null);
        }}
        className="text-muted hover:text-foreground text-xs font-medium"
      >
        {mode === "single"
          ? "Paste multiple expenses instead"
          : "Add one expense instead"}
      </button>
    </div>
  );
}
