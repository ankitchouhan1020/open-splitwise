"use client";

import { AddExpenseForm } from "@/components/add-expense-form";
import { IconClose } from "@/components/expense-icons";
import { useAddExpenseDialog } from "@/components/add-expense-provider";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddExpenseDrawer({ open, onClose }: Props) {
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
        className="add-drawer-backdrop bg-overlay fixed inset-0 z-50"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
        className="add-drawer-panel border-border bg-card fixed inset-x-0 bottom-0 z-[51] flex max-h-[min(92dvh,760px)] w-full flex-col rounded-t-2xl border shadow-2xl sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:max-h-none sm:max-w-[520px] sm:rounded-none sm:rounded-l-2xl"
      >
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <span className="bg-border/80 h-1 w-9 rounded-full" aria-hidden />
        </div>
        <div className="border-border flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5">
          <h2
            id="add-expense-title"
            className="text-foreground text-[17px] font-semibold tracking-tight"
          >
            Add expense
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground hover:bg-hover inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            aria-label="Close"
          >
            <IconClose className="h-[17px] w-[17px]" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <AddExpenseForm autoFocus />
        </div>
      </aside>
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
