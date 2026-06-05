"use client";

import { ExpenseDetailPanel } from "@/components/expense-detail-panel";
import type { ExpenseDetail } from "@/lib/expenses/types";
import { useEffect } from "react";

type Props = {
  expense: ExpenseDetail | null;
  loading: boolean;
  onClose: () => void;
  initialMode?: "view" | "edit";
};

export function ExpenseDetailDrawer({
  expense,
  loading,
  onClose,
  initialMode = "view",
}: Props) {
  const open = Boolean(expense) || loading;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="bg-overlay fixed inset-0 z-40 backdrop-blur-[1px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        className="border-border bg-card fixed inset-x-0 bottom-0 z-50 flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-2xl border shadow-2xl sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:max-h-none sm:max-w-[520px] sm:rounded-none sm:rounded-l-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={initialMode === "edit" ? "Edit expense" : "Expense details"}
      >
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="bg-border h-1 w-10 rounded-full" aria-hidden />
        </div>
        <ExpenseDetailPanel
          expense={expense}
          loading={loading}
          onClose={onClose}
          initialMode={initialMode}
          variant="drawer"
        />
      </aside>
    </>
  );
}
