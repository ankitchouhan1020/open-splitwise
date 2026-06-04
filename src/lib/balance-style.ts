export type BalanceTag = "you_owe" | "you_are_owed";

const styles = {
  you_owe: {
    label: "text-amber-800",
    amount: "text-amber-700",
    badge:
      "rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900",
    card: "border-amber-200 bg-amber-50/50",
    rowStripe: "border-l-2 border-l-amber-400",
    rowHover: "hover:bg-amber-50/50",
  },
  you_are_owed: {
    label: "text-teal-800",
    amount: "text-teal-700",
    badge:
      "rounded bg-teal-100 px-1.5 py-0.5 text-[11px] font-medium text-teal-900",
    card: "border-teal-200 bg-teal-50/50",
    rowStripe: "border-l-2 border-l-teal-400",
    rowHover: "hover:bg-teal-50/50",
  },
} as const;

export function balanceClasses(tag: BalanceTag) {
  return styles[tag];
}

export function balanceLabel(tag: BalanceTag): string {
  return tag === "you_owe" ? "You owe" : "You're owed";
}
