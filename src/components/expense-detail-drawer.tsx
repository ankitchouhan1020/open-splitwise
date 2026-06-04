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
  onClose: () => void;
  initialMode?: "view" | "edit";
};

const actionBtn =
  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 sm:flex-none";
const actionSecondary = `${actionBtn} border-border border bg-white hover:bg-stone-50`;
const actionDanger = `${actionBtn} border border-red-200 text-red-700 hover:bg-red-50`;

export function ExpenseDetailDrawer({
  expense,
  loading,
  onClose,
  initialMode = "view",
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
      onClose();
    } catch {
      setDeleteError("Something went wrong. Try again.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (!open) return null;

  const mutable = expense ? isExpenseMutable(expense) : false;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        className="border-border bg-card fixed inset-x-0 bottom-0 z-50 flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-2xl border shadow-2xl sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "Edit expense" : "Expense details"}
      >
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="bg-border h-1 w-10 rounded-full" aria-hidden />
        </div>

        <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-semibold">
              {mode === "edit" ? "Edit expense" : "Expense"}
            </h2>
            {expense?.payment && (
              <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-900">
                Payment
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-stone-100"
            aria-label="Close"
          >
            <IconClose className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
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
          <div className="border-border space-y-2 border-t bg-stone-50/50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {confirmDelete ? (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <IconTrash
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                    aria-hidden
                  />
                  <p className="text-sm leading-snug text-red-900">
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
                    className="border-border inline-flex flex-1 items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-stone-50"
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
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
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
      </aside>
    </>
  );
}
