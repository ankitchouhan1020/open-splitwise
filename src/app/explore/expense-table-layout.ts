/** Shared grid for Explore expense table — keep header and rows in sync. */
export const EXPENSE_TABLE_GRID =
  "grid grid-cols-[4.5rem_minmax(0,1fr)_5.25rem] sm:grid-cols-[5.5rem_minmax(10rem,1fr)_minmax(6rem,10rem)_6.5rem_6.5rem] lg:grid-cols-[5.75rem_minmax(12rem,1fr)_minmax(7rem,11rem)_7rem_7rem] items-start gap-x-3 gap-y-0";

export const EXPENSE_TABLE_HEADER =
  "text-muted px-3 py-2 text-[11px] font-semibold tracking-wider uppercase";

export const EXPENSE_TABLE_CELL_DATE =
  "text-muted pt-0.5 text-[13px] leading-snug tabular-nums";

export const EXPENSE_TABLE_CELL_DESC =
  "text-foreground min-w-0 text-[13px] leading-snug font-medium";

export const EXPENSE_TABLE_CELL_GROUP =
  "text-muted hidden truncate pt-0.5 text-[13px] leading-snug sm:block";

export const EXPENSE_TABLE_CELL_AMOUNT =
  "text-foreground pt-0.5 text-right font-mono text-[13px] leading-snug font-semibold tabular-nums";

export const EXPENSE_TABLE_CELL_TOTAL =
  "text-muted hidden pt-0.5 text-right font-mono text-[13px] leading-snug tabular-nums sm:block";

/** Hide on mobile (3-col layout). */
export const EXPENSE_COL_GROUP = "hidden sm:block";
export const EXPENSE_COL_TOTAL = "hidden sm:block";
