"use client";

import {
  ExpenseCurrencySelect,
  ExpenseGroupPicker,
} from "@/components/expense-group-picker";
import { AddExpenseFormSkeleton } from "@/components/expense-detail-skeleton";
import { useExpenseFormOptions } from "@/components/use-expense-form-options";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { splitwiseExpenseUrl } from "@/lib/splitwise/urls";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  variant?: "default" | "compact";
  onSuccess?: () => void;
  autoFocus?: boolean;
};

function defaultDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const inputClass =
  "border-border focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2";
const labelClass = "text-foreground text-sm font-medium";

export function AddExpenseForm({
  variant = "default",
  onSuccess,
  autoFocus = false,
}: Props) {
  const queryClient = useQueryClient();
  const {
    loading,
    groups,
    categories,
    currencies,
    suggestions,
    defaultCurrency,
    defaultGroup,
  } = useExpenseFormOptions();

  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(defaultDateTimeLocal);
  const [details, setDetails] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    text: string;
    splitwiseId: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultGroupApplied = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (defaultGroup && !defaultGroupApplied.current) {
      setGroupId(String(defaultGroup.id));
      setGroupName(defaultGroup.name);
      defaultGroupApplied.current = true;
    }
    setCurrencyCode(defaultCurrency);
  }, [loading, defaultGroup, defaultCurrency]);

  useEffect(() => {
    if (!autoFocus || loading) return;
    amountRef.current?.focus();
  }, [autoFocus, loading]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "Enter" &&
        !submitting &&
        groupId
      ) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [submitting, groupId]);

  const topDescriptions = suggestions?.descriptions.slice(0, 8) ?? [];
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

  function resetForAnother() {
    setDescription("");
    setCost("");
    setDetails("");
    setCategoryId("");
    setDate(defaultDateTimeLocal());
    setSuccess(null);
    setError(null);
    amountRef.current?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId) {
      setError("Pick a group first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(groupId),
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
        setSuccess({
          text: `Added to ${groupName || "group"} — split equally.`,
          splitwiseId: data.splitwiseId,
        });
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isCompact = variant === "compact";

  if (loading) {
    return <AddExpenseFormSkeleton />;
  }

  if (success) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-sm font-medium text-teal-900">{success.text}</p>
          <p className="text-muted mt-1 text-xs">
            Synced locally. Custom splits stay in Splitwise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetForAnother}
            className="bg-accent rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add another
          </button>
          <a
            href={splitwiseExpenseUrl(success.splitwiseId)}
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

  return (
    <form
      ref={formRef}
      onSubmit={(e) => void submit(e)}
      className={
        isCompact
          ? "space-y-4"
          : "border-border bg-card space-y-5 rounded-2xl border p-6 shadow-sm"
      }
    >
      {!isCompact && (
        <div>
          <h3 className="text-foreground text-lg font-semibold tracking-tight">
            Log a group expense
          </h3>
          <p className="text-muted mt-1 text-sm leading-relaxed">
            Split equally with everyone in the group.
          </p>
        </div>
      )}

      <ExpenseGroupPicker
        groups={groups}
        topGroups={suggestions?.groups.slice(0, 6) ?? []}
        groupId={groupId}
        onGroupChange={(id, name) => {
          setGroupId(id);
          if (id) setGroupName(name);
          setError(null);
        }}
      />

      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-cost" className={labelClass}>
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
            className={`${inputClass} text-lg font-semibold tabular-nums`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-currency" className={labelClass}>
            Currency
          </label>
          <ExpenseCurrencySelect
            currencies={currencies}
            currencyCode={currencyCode}
            onChange={setCurrencyCode}
            compact
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="expense-desc" className={labelClass}>
          Description
        </label>
        <input
          id="expense-desc"
          required
          placeholder="What was it for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
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
            <label htmlFor="expense-date" className={labelClass}>
              Date
            </label>
            <input
              id="expense-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="expense-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="expense-notes"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Receipt #, who was there…"
              className={inputClass}
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
          disabled={submitting || !groupId}
          className="bg-accent rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add expense"}
        </button>
        <span className="text-muted text-xs">Split equally · ⌘↵ to save</span>
      </div>
    </form>
  );
}
