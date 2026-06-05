"use client";

import { EditExpenseForm } from "@/components/edit-expense-form";
import { ExpenseDetailView } from "@/components/expense-detail-view";
import {
  IconCheck,
  IconClose,
  IconEdit,
  IconExternalLink,
  IconTrash,
} from "@/components/expense-icons";
import { ExpenseDetailSkeleton } from "@/components/expense-detail-skeleton";
import type { ExpenseDetail } from "@/lib/expenses/types";
import { isExpenseMutable } from "@/lib/expenses/mutable";
import { invalidateExpenseCaches } from "@/lib/query/invalidate";
import { splitwiseExpenseUrl } from "@/lib/splitwise/urls";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Props = {
  expense: ExpenseDetail | null;
  loading: boolean;
  onClose?: () => void;
  initialMode?: "view" | "edit";
  /** Inline pane (desktop split view) vs overlay drawer. */
  variant?: "drawer" | "inline";
  selected?: boolean;
};

const actionBtn =
  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 sm:flex-none";
const actionSecondary = `${actionBtn} border-border border bg-card hover:bg-hover`;
const actionDanger = `${actionBtn} border-error-border bg-card text-error-text hover:bg-error-bg border`;

export function ExpenseDetailPanel({
  expense,
  loading,
  onClose,
  initialMode = "view",
  variant = "drawer",
  selected = false,
}: Props) {
  const queryClient = useQueryClient();
  const open = Boolean(expense) || loading;
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("view");
      setConfirmDelete(false);
      setDeleteError(null);
      return;
    }
    setMode(initialMode);
    setConfirmDelete(false);
    setDeleteError(null);
  }, [open, expense?.id, initialMode]);

  async function handleDelete() {
    if (!expense) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
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
        setDeleteError(
          `${data.error ?? "Could not delete expense"}${detailText ? ` — ${detailText}` : ""}`,
        );
        return;
      }
      await invalidateExpenseCaches(queryClient);
      onClose?.();
    } catch {
      setDeleteError("Something went wrong. Try again.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (variant === "inline" && !open) {
    return (
      <div className="border-border bg-card text-muted flex h-full min-h-[320px] flex-col items-center justify-center rounded-lg border p-8 text-center text-sm">
        <p className="text-foreground font-medium">Select an expense</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed">
          Pick a row from the list to see split details here. Use ↑↓ or j/k to
          move, Enter to open.
        </p>
      </div>
    );
  }

  if (!open) return null;

  const mutable = expense ? isExpenseMutable(expense) : false;
  const inline = variant === "inline";

  return (
    <div
      className={
        inline
          ? `border-border bg-card flex h-full max-h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden rounded-lg border shadow-sm ${selected ? "ring-accent/30 ring-2" : ""}`
          : "flex h-full min-h-0 flex-col"
      }
      role={inline ? "region" : undefined}
      aria-label={inline ? "Expense details" : undefined}
    >
      <div className="border-border flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-base font-semibold">
            {mode === "edit" ? "Edit expense" : "Expense"}
          </h2>
          {expense?.payment && (
            <span className="bg-balance-get-bg text-balance-get shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">
              Payment
            </span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground hover:bg-hover inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <IconClose className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading && <ExpenseDetailSkeleton />}
        {!loading && expense && mode === "edit" && (
          <EditExpenseForm
            expense={expense}
            onCancel={() => setMode("view")}
            onSuccess={() => setMode("view")}
          />
        )}
        {!loading && expense && mode === "view" && (
          <ExpenseDetailView expense={expense} />
        )}
      </div>

      {expense && mode === "view" && (
        <div className="border-border bg-muted-surface/60 shrink-0 space-y-2 border-t px-4 py-3">
          {confirmDelete ? (
            <div className="border-error-border bg-error-bg space-y-2 rounded-xl border p-3">
              <div className="flex items-start gap-2">
                <IconTrash
                  className="text-error-text mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <p className="text-error-text text-sm leading-snug">
                  Delete this expense from Splitwise? This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <IconCheck className="h-3.5 w-3.5" />
                  {deleting ? "Deleting…" : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteError(null);
                  }}
                  className="border-border bg-card hover:bg-hover inline-flex flex-1 items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mutable && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className={actionSecondary}
                  >
                    <IconEdit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className={actionDanger}
                  >
                    <IconTrash className="h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
              <a
                href={splitwiseExpenseUrl(expense.splitwiseId)}
                target="_blank"
                rel="noopener noreferrer"
                className={actionSecondary}
              >
                <IconExternalLink className="h-4 w-4" />
                Splitwise
              </a>
            </div>
          )}
          {deleteError && (
            <p className="bg-error-bg text-error-text rounded-xl px-3 py-2 text-sm">
              {deleteError}
            </p>
          )}
          {!mutable && !confirmDelete && (
            <p className="text-muted text-center text-xs">
              {expense.payment
                ? "Payments can only be changed in Splitwise."
                : "Non-group expenses can only be changed in Splitwise."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
