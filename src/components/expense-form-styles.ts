export const expenseInputClass =
  "border-border bg-input text-foreground focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2";

export const expenseLabelClass = "text-foreground text-sm font-medium";

export function defaultExpenseDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
