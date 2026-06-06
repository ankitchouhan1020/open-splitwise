"use client";

import { useAddExpenseDialog } from "@/components/add-expense-provider";
import { NavIconAdd } from "@/components/nav-icons";
import { DEMO_MODE_COPY } from "@/lib/demo/copy";

type Props = {
  visible: boolean;
  disabled?: boolean;
};

export function MobileAddFab({ visible, disabled = false }: Props) {
  const { openDialog } = useAddExpenseDialog();

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : openDialog}
      disabled={disabled}
      aria-label="Add expense"
      title={disabled ? DEMO_MODE_COPY.addExpense : undefined}
      className="bg-accent text-accent-foreground fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
      style={{
        right: "max(1rem, env(safe-area-inset-right, 0px))",
        bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px) + 0.5rem)",
      }}
    >
      <NavIconAdd className="h-7 w-7" />
    </button>
  );
}
