"use client";

import { AddExpenseForm } from "@/components/add-expense-form";
import { BulkAddExpenseForm } from "@/components/bulk-add-expense-form";
import { useEffect, useState } from "react";

type Mode = "single" | "bulk";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddExpenseDialog({ open, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("single");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setMode("single");
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
        className={`border-border bg-card fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl border-t shadow-2xl sm:inset-x-auto sm:top-[8vh] sm:bottom-auto sm:left-1/2 sm:max-h-[88vh] sm:w-full sm:-translate-x-1/2 sm:rounded-2xl sm:border ${
          mode === "bulk" ? "sm:max-w-xl" : "sm:max-w-lg"
        }`}
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <h2
              id="add-expense-title"
              className="text-lg font-semibold tracking-tight"
            >
              Add expense
            </h2>
            <div
              className="border-border flex rounded-lg border p-0.5"
              role="tablist"
              aria-label="Add mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "single"}
                onClick={() => setMode("single")}
                className={
                  mode === "single"
                    ? "bg-accent rounded-md px-2.5 py-1 text-xs font-semibold text-white"
                    : "text-muted hover:text-foreground rounded-md px-2.5 py-1 text-xs font-medium"
                }
              >
                Single
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "bulk"}
                onClick={() => setMode("bulk")}
                className={
                  mode === "bulk"
                    ? "bg-accent rounded-md px-2.5 py-1 text-xs font-semibold text-white"
                    : "text-muted hover:text-foreground rounded-md px-2.5 py-1 text-xs font-medium"
                }
              >
                Bulk
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground shrink-0 rounded-md px-2 py-1 text-sm font-medium"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          {mode === "single" ? (
            <AddExpenseForm variant="compact" autoFocus onSuccess={onClose} />
          ) : (
            <BulkAddExpenseForm onSuccess={onClose} />
          )}
        </div>
      </div>
    </>
  );
}

export function AddExpenseButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? "Add expense"}
      </button>
      <AddExpenseDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
