"use client";

import { AddExpenseDialog } from "@/components/add-expense-dialog";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AddExpenseContextValue = {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
};

const AddExpenseContext = createContext<AddExpenseContextValue | null>(null);

export function AddExpenseProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openDialog, closeDialog }),
    [open, openDialog, closeDialog],
  );

  return (
    <AddExpenseContext.Provider value={value}>
      {children}
      <AddExpenseDialog open={open} onClose={closeDialog} />
    </AddExpenseContext.Provider>
  );
}

export function useAddExpenseDialog() {
  const ctx = useContext(AddExpenseContext);
  if (!ctx) {
    throw new Error("useAddExpenseDialog must be used within AddExpenseProvider");
  }
  return ctx;
}

/** Safe outside provider — no-op when unavailable. */
export function useAddExpenseDialogOptional() {
  return useContext(AddExpenseContext);
}
