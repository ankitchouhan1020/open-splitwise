"use client";

import { useAddExpenseDialog } from "@/components/add-expense-provider";
import { NavIconAdd } from "@/components/nav-icons";

type Props = {
  visible: boolean;
};

export function MobileAddFab({ visible }: Props) {
  const { openDialog } = useAddExpenseDialog();

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={openDialog}
      aria-label="Add expense"
      className="bg-accent text-accent-foreground fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:opacity-90 md:hidden"
      style={{
        right: "max(1rem, env(safe-area-inset-right, 0px))",
        bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px) + 0.5rem)",
      }}
    >
      <NavIconAdd className="h-7 w-7" />
    </button>
  );
}
