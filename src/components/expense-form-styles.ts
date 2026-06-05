export const expenseInputClass =
  "border-border bg-input text-foreground placeholder:text-muted w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15";

export const expenseAmountHeroClass =
  "text-foreground placeholder:text-muted/50 min-w-0 flex-1 border-0 bg-transparent text-3xl font-semibold tracking-tight tabular-nums outline-none sm:text-4xl";

export const expenseLabelClass = "text-foreground text-sm font-medium";

export function defaultExpenseDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
