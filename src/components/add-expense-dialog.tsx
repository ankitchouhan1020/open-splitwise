"use client";

import { AddExpenseForm } from "@/components/add-expense-form";
import { useAddExpenseDialog } from "@/components/add-expense-provider";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddExpenseDialog({ open, onClose }: Props) {
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
        className="border-border bg-card fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl border-t shadow-2xl sm:inset-x-auto sm:top-[8vh] sm:bottom-auto sm:left-1/2 sm:max-h-[88vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:rounded-2xl sm:border"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <h2
            id="add-expense-title"
            className="text-lg font-semibold tracking-tight"
          >
            Add expense
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground shrink-0 rounded-md px-2 py-1 text-sm font-medium"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <AddExpenseForm autoFocus onSuccess={onClose} />
        </div>
      </div>
    </>
  );
}

export function AddExpenseButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children?: ReactNode;
}) {
  const { openDialog } = useAddExpenseDialog();
  return (
    <button type="button" onClick={openDialog} className={className} {...props}>
      {children ?? "Add expense"}
    </button>
  );
}
