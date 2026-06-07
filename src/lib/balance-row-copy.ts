import { balanceNetLabel, type BalanceTag } from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";

/** Primary row title for a balance line, e.g. "You're owed $50.00". */
export function balanceRowTitle(
  tag: BalanceTag,
  amount: number,
  currency: string,
): string {
  const formatted = formatMoney(amount, currency);
  return tag === "you_are_owed"
    ? `You're owed ${formatted}`
    : `You owe ${formatted}`;
}

/** Person-specific headline for settle flows, e.g. "Jordan owes you $10.00". */
export function personBalanceRowTitle(
  tag: BalanceTag,
  personName: string,
  amount: number,
  currency: string,
): string {
  const formatted = formatMoney(amount, currency);
  return tag === "you_are_owed"
    ? `${personName} owes you ${formatted}`
    : `You owe ${personName} ${formatted}`;
}

/** Join context parts for a balance row subline. */
export function balanceRowSubline(
  ...parts: Array<string | null | undefined>
): string {
  return parts.filter((part) => part && part.trim().length > 0).join(" · ");
}

const EPS = 0.005;

export type GroupBalanceSummary = {
  youAreOwed: number;
  youOwe: number;
};

/** Sum net balances across groups (positive = owed to you, negative = you owe). */
export function summarizeGroupNetBalances(
  groups: Array<{ netBalance: string | number }>,
): GroupBalanceSummary {
  let youAreOwed = 0;
  let youOwe = 0;

  for (const group of groups) {
    const net = Number(group.netBalance);
    if (!Number.isFinite(net)) continue;
    if (net > EPS) youAreOwed += net;
    else if (net < -EPS) youOwe += Math.abs(net);
  }

  return {
    youAreOwed: Math.round(youAreOwed * 100) / 100,
    youOwe: Math.round(youOwe * 100) / 100,
  };
}

/** Net balance headline, e.g. "₹11,011.31 to get overall". */
export function balanceOverallHeading(
  youAreOwed: number,
  youOwe: number,
  currency: string,
): string {
  const net = Math.round((youAreOwed - youOwe) * 100) / 100;
  if (Math.abs(net) <= EPS) {
    return "Even overall";
  }
  const tag: BalanceTag = net > 0 ? "you_are_owed" : "you_owe";
  return `${formatMoney(Math.abs(net), currency)} ${balanceNetLabel(tag).toLowerCase()}`;
}

/** Section heading for groups with outstanding balances. */
export function groupUnsettledSectionHeading(
  groups: Array<{ netBalance: string | number }>,
  currency: string,
): string {
  const { youAreOwed, youOwe } = summarizeGroupNetBalances(groups);
  return balanceOverallHeading(youAreOwed, youOwe, currency);
}

/** Section heading for groups where your net balance is zero. */
export function groupSettledSectionHeading(groupCount: number): string {
  const countLabel = `${groupCount} group${groupCount === 1 ? "" : "s"}`;
  return `Settled up · ${countLabel}`;
}
