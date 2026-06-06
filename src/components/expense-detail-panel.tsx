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
import { friendlyExpenseError } from "@/lib/api-errors";
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

const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50";
const iconSecondary = `${iconBtn} border-border border bg-card text-muted hover:text-foreground hover:bg-hover`;
const iconDanger = `${iconBtn} border-error-border text-error-text hover:bg-error-bg border`;

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
        setDeleteError(
          friendlyExpenseError(
            data.error,
            data.details,
            "Couldn't delete the expense. Try again.",
          ),
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
      <div className="border-border flex shrink-0 flex-col gap-2 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
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
          <div className="flex shrink-0 items-center gap-1">
            {expense && mode === "view" && !confirmDelete && (
              <>
                {mutable && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode("edit")}
                      className={iconSecondary}
                      aria-label="Edit expense"
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className={iconDanger}
                      aria-label="Delete expense"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </>
                )}
                <a
                  href={splitwiseExpenseUrl(expense.splitwiseId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconSecondary}
                  aria-label="Open in Splitwise"
                >
                  <IconExternalLink className="h-4 w-4" />
                </a>
              </>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`${iconBtn} text-muted hover:text-foreground hover:bg-hover`}
                aria-label="Close"
              >
                <IconClose className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </div>

        {expense && mode === "view" && confirmDelete && (
          <div className="border-error-border bg-error-bg flex items-center gap-2 rounded-lg border px-2.5 py-2">
            <p className="text-error-text min-w-0 flex-1 text-xs leading-snug">
              Delete from Splitwise?
            </p>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <IconCheck className="h-3 w-3" />
              {deleting ? "…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setDeleteError(null);
              }}
              className="text-muted hover:text-foreground shrink-0 px-1.5 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {deleteError && (
          <p className="bg-error-bg text-error-text rounded-lg px-2.5 py-1.5 text-xs">
            {deleteError}
          </p>
        )}

        {expense && mode === "view" && !mutable && !confirmDelete && (
          <p className="text-muted text-xs">
            {expense.payment
              ? "Payments can only be changed in Splitwise."
              : "Non-group expenses can only be changed in Splitwise."}
          </p>
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
    </div>
  );
}
