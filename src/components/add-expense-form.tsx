"use client";

import { ExpenseCurrencySelect } from "@/components/expense-group-picker";
import { ExpenseFormGroupSection } from "@/components/expense-form-group-section";
import { ExpenseParticipantPicker } from "@/components/expense-participant-picker";
import { IconChevronDown } from "@/components/expense-icons";
import {
  defaultExpenseDateTimeLocal,
  expenseAmountHeroClass,
  expenseInputClass,
  expenseLabelClass,
} from "@/components/expense-form-styles";
import { AddExpenseFormSkeleton } from "@/components/expense-detail-skeleton";
import { useToast } from "@/components/toast-provider";
import { useExpenseFormDefaults } from "@/components/use-expense-form-defaults";
import { formatMoney } from "@/lib/format";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Props = {
  autoFocus?: boolean;
};

function costPreview(cost: string, currency: string): string | null {
  const n = Number.parseFloat(cost);
  if (!cost.trim() || Number.isNaN(n) || n < 0) return null;
  return formatMoney(n, currency);
}

function equalSharePreview(
  cost: string,
  participantCount: number,
  currency: string,
): string | null {
  const n = Number.parseFloat(cost);
  if (!cost.trim() || Number.isNaN(n) || n <= 0 || participantCount <= 0) {
    return null;
  }
  return formatMoney(n / participantCount, currency);
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={expenseLabelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  value,
  onClick,
  expanded,
}: {
  label: string;
  value: string;
  onClick: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="border-border hover:bg-hover/50 flex w-full items-center gap-3 border-b py-3.5 text-left transition-colors last:border-b-0"
    >
      <span className="text-muted w-20 shrink-0 text-sm">{label}</span>
      <span className="text-foreground min-w-0 flex-1 truncate text-sm">
        {value}
      </span>
      <IconChevronDown
        className={`text-muted h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : "-rotate-90"}`}
      />
    </button>
  );
}

export function AddExpenseForm({ autoFocus = false }: Props) {
  const queryClient = useQueryClient();
  const { show: showToast } = useToast();
  const form = useExpenseFormDefaults();

  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(defaultExpenseDateTimeLocal);
  const [details, setDetails] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const descriptionRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const categories = useMemo(() => {
    const seen = new Set<number>();
    const out: { id: number; name: string }[] = [];
    for (const c of [
      ...(form.suggestions?.categories ?? []),
      ...form.categories,
    ]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
    return out;
  }, [form.suggestions?.categories, form.categories]);

  const quickDescriptions = useMemo(
    () => (form.suggestions?.descriptions ?? []).slice(0, 4),
    [form.suggestions?.descriptions],
  );

  const showCurrency = form.currencies.length > 1;
  const preview = costPreview(cost, form.currencyCode);
  const shareEach = equalSharePreview(
    cost,
    form.participantIds.length,
    form.currencyCode,
  );

  function resolveCategoryId(name: string): number | undefined {
    const q = name.trim().toLowerCase();
    if (!q) return undefined;
    return categories.find((c) => c.name.toLowerCase() === q)?.id;
  }

  useEffect(() => {
    if (!autoFocus || form.loading) return;
    descriptionRef.current?.focus();
  }, [autoFocus, form.loading]);

  function resetFields() {
    setDescription("");
    setCost("");
    setDetails("");
    setCategory("");
    setDate(defaultExpenseDateTimeLocal());
    setShowMore(false);
    setError(null);
    descriptionRef.current?.focus();
  }

  function handleGroupChange(id: string, name: string) {
    form.onGroupChange(id, name);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.groupId) {
      setError("Select a group.");
      return;
    }
    const finalDescription = description.trim();
    if (!finalDescription) {
      setError("Enter a description.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(form.groupId),
          description: finalDescription,
          cost,
          currencyCode: form.currencyCode,
          categoryId: resolveCategoryId(category),
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
        const groupLabel = form.groupName || "group";
        showToast(
          preview
            ? `Added ${preview} to ${groupLabel}`
            : `Added to ${groupLabel}`,
        );
        resetFields();
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (form.loading) {
    return <AddExpenseFormSkeleton />;
  }

  const submitLabel = submitting
    ? "Adding…"
    : preview
      ? `Add ${preview}`
      : "Add expense";

  return (
    <form
      ref={formRef}
      onSubmit={(e) => void submit(e)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        <div className="space-y-4">
          <ExpenseFormGroupSection
            groups={form.groups}
            topGroups={form.suggestions?.groups.slice(0, 6) ?? []}
            groupId={form.groupId}
            onGroupChange={handleGroupChange}
            participantIds={form.participantIds}
            onParticipantChange={form.setParticipantIds}
            paidByUserId={form.paidByUserId}
            onPaidByChange={form.setPaidByUserId}
            showSplit={false}
          />

          <FormField label="Description" htmlFor="expense-desc">
            <input
              ref={descriptionRef}
              id="expense-desc"
              required
              placeholder="Groceries, dinner, rent…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={expenseInputClass}
              list="expense-desc-suggestions"
              autoComplete="off"
            />
            <datalist id="expense-desc-suggestions">
              {quickDescriptions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            {!description.trim() && quickDescriptions.length > 0 && (
              <p className="text-muted flex flex-wrap gap-x-2 gap-y-1 text-xs">
                <span className="text-muted/80">Recent:</span>
                {quickDescriptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDescription(d)}
                    className="text-accent hover:underline"
                  >
                    {d}
                  </button>
                ))}
              </p>
            )}
          </FormField>

          <section
            aria-labelledby="expense-amount-heading"
            className="border-border bg-muted-surface overflow-hidden rounded-xl border"
          >
            <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
              <h3 id="expense-amount-heading" className="sr-only">
                Amount and split
              </h3>
              <div className="flex items-center gap-2 sm:gap-3">
                {showCurrency ? (
                  <ExpenseCurrencySelect
                    currencies={form.currencies}
                    currencyCode={form.currencyCode}
                    onChange={form.setCurrencyCode}
                    compact
                  />
                ) : (
                  <span className="text-muted shrink-0 text-sm font-medium tabular-nums">
                    {form.currencyCode}
                  </span>
                )}
                <input
                  ref={costRef}
                  id="expense-cost"
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
              {shareEach && form.participantIds.length > 1 ? (
                <p className="text-muted mt-2 text-sm tabular-nums">
                  ≈ {shareEach} each · {form.participantIds.length} people
                </p>
              ) : preview ? (
                <p className="text-muted mt-2 text-sm tabular-nums">
                  {preview}
                </p>
              ) : null}
            </div>

            {form.groupId ? (
              <ExpenseParticipantPicker
                key={form.groupId}
                groupId={form.groupId}
                selectedIds={form.participantIds}
                onSelectedChange={form.setParticipantIds}
                paidByUserId={form.paidByUserId}
                onPaidByChange={form.setPaidByUserId}
                embedded
              />
            ) : (
              <p className="text-muted border-border border-t px-4 py-3.5 text-sm sm:px-5">
                Select a group to configure the split.
              </p>
            )}
          </section>
        </div>

        <div className="border-border mt-5 border-t">
          <SettingsRow
            label="More"
            value={
              showMore
                ? "Hide options"
                : category || details
                  ? "Category or notes set"
                  : "Category, date, notes"
            }
            onClick={() => setShowMore((v) => !v)}
            expanded={showMore}
          />
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${showMore ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="space-y-3 pb-4">
                {categories.length > 0 && (
                  <>
                    <input
                      id="expense-category"
                      placeholder="Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={expenseInputClass}
                      list="expense-category-suggestions"
                      autoComplete="off"
                    />
                    <datalist id="expense-category-suggestions">
                      {categories.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </>
                )}
                <input
                  id="expense-date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={expenseInputClass}
                  aria-label="Date"
                />
                <textarea
                  id="expense-notes"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  placeholder="Notes"
                  className={expenseInputClass}
                />
              </div>
            </div>
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
          disabled={submitting || !form.groupId}
          className="bg-accent text-accent-foreground flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting && (
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
