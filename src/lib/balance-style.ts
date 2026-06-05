export type BalanceTag = "you_owe" | "you_are_owed";

const styles = {
  you_owe: {
    label: "text-balance-pay",
    amount: "text-balance-pay",
    badge:
      "rounded bg-balance-pay-bg px-1.5 py-0.5 text-[11px] font-medium text-balance-pay",
    card: "border-balance-pay-border bg-balance-pay-bg/60",
    rowStripe: "border-l-2 border-l-balance-pay-border",
    rowHover: "hover:bg-balance-pay-bg/30",
  },
  you_are_owed: {
    label: "text-balance-get",
    amount: "text-balance-get",
    badge:
      "rounded bg-balance-get-bg px-1.5 py-0.5 text-[11px] font-medium text-balance-get",
    card: "border-balance-get-border bg-balance-get-bg/60",
    rowStripe: "border-l-2 border-l-balance-get-border",
    rowHover: "hover:bg-balance-get-bg/30",
  },
} as const;

export function balanceClasses(tag: BalanceTag) {
  return styles[tag];
}

/** Left border for rows with no outstanding balance. */
export const settledRowStripe = "border-l-2 border-l-border";

export type RowStripe = BalanceTag | "settled";

export function rowStripeClass(stripe?: RowStripe): string {
  if (!stripe) return "";
  if (stripe === "settled") return settledRowStripe;
  return balanceClasses(stripe).rowStripe;
}

export function balanceLabel(tag: BalanceTag): string {
  return tag === "you_owe" ? "To pay" : "To get";
}

/** Net balance line, e.g. "₹1,240 to get overall". */
export function balanceNetLabel(tag: BalanceTag): string {
  return tag === "you_owe" ? "to pay overall" : "to get overall";
}

/** Section headers on Friends / Home balance panels. */
export function balanceSectionLabel(tag: BalanceTag): string {
  return tag === "you_owe" ? "To pay" : "To get";
}
