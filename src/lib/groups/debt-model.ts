import type {
  SplitwiseDebt,
  SplitwiseGroupMember,
} from "@/lib/splitwise/types";

const EPS = 0.005;

export type CachedGroupDebt = {
  fromUserId: number;
  toUserId: number;
  amount: number;
  currencyCode: string;
};

export type OwnerSettleEntry = {
  userId: number;
  direction: "to_get" | "to_pay";
  amount: number;
  currencyCode: string;
};

/** Debts Splitwise exposes for the group (respects simplify-by-default). */
export function activeGroupDebts(input: {
  simplifyByDefault: boolean;
  originalDebts?: SplitwiseDebt[];
  simplifiedDebts?: SplitwiseDebt[];
}): SplitwiseDebt[] {
  const primary = input.simplifyByDefault
    ? (input.simplifiedDebts ?? [])
    : (input.originalDebts ?? []);
  if (primary.length > 0) return primary;

  const fallback = input.simplifyByDefault
    ? (input.originalDebts ?? [])
    : (input.simplifiedDebts ?? []);
  return fallback;
}

export function parseSplitwiseDebts(debts: SplitwiseDebt[]): CachedGroupDebt[] {
  const rows: CachedGroupDebt[] = [];
  for (const debt of debts) {
    const amount = Number.parseFloat(debt.amount);
    if (!Number.isFinite(amount) || amount <= EPS) continue;
    rows.push({
      fromUserId: debt.from,
      toUserId: debt.to,
      amount: Math.round(amount * 100) / 100,
      currencyCode: debt.currency_code,
    });
  }
  return rows;
}

/** Splitwise member balance in a group: positive = member is owed money. */
export function ownerNetFromGroupMembers(
  members: SplitwiseGroupMember[],
  ownerSplitwiseId: number,
  currencyCode: string,
): number | null {
  const member = members.find((m) => m.id === ownerSplitwiseId);
  const entry = member?.balance?.find((b) => b.currency_code === currencyCode);
  if (!entry) return null;
  const amount = Number.parseFloat(entry.amount);
  if (!Number.isFinite(amount) || Math.abs(amount) <= EPS) return 0;
  return Math.round(amount * 100) / 100;
}

export function memberNameFromSplitwise(member: SplitwiseGroupMember): string {
  const parts = [member.first_name, member.last_name].filter(Boolean);
  return parts.join(" ").trim() || member.email || `User ${member.id}`;
}

/** Pairwise settle lines for the owner from Splitwise debts. */
export function ownerSettleEntriesFromDebts(
  ownerSplitwiseId: number,
  debts: CachedGroupDebt[],
  currencyCode: string,
): OwnerSettleEntry[] {
  const entries: OwnerSettleEntry[] = [];

  for (const debt of debts) {
    if (debt.currencyCode !== currencyCode) continue;

    if (
      debt.toUserId === ownerSplitwiseId &&
      debt.fromUserId !== ownerSplitwiseId
    ) {
      entries.push({
        userId: debt.fromUserId,
        direction: "to_get",
        amount: debt.amount,
        currencyCode: debt.currencyCode,
      });
      continue;
    }

    if (
      debt.fromUserId === ownerSplitwiseId &&
      debt.toUserId !== ownerSplitwiseId
    ) {
      entries.push({
        userId: debt.toUserId,
        direction: "to_pay",
        amount: debt.amount,
        currencyCode: debt.currencyCode,
      });
    }
  }

  return entries;
}

export function mergeOwnerSettleEntries(
  entries: OwnerSettleEntry[],
): OwnerSettleEntry[] {
  const byKey = new Map<string, OwnerSettleEntry>();

  for (const entry of entries) {
    const key = `${entry.userId}:${entry.direction}:${entry.currencyCode}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...entry });
      continue;
    }
    prev.amount = Math.round((prev.amount + entry.amount) * 100) / 100;
  }

  return [...byKey.values()];
}
