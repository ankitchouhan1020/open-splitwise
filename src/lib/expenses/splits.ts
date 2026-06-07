import type { MemberSplitInput, SplitMode } from "@/lib/expenses/split-types";

/** Normalize a decimal cost string to two decimal places. */
export function formatCostAmount(cost: string): string {
  const value = Number.parseFloat(cost);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("invalid_cost");
  }
  return value.toFixed(2);
}

/** Split a cost equally across N people; remainder cents go to earlier shares. */
export function equalOwedShares(cost: string, count: number): string[] {
  if (count <= 0) throw new Error("participants_required");

  const totalCents = Math.round(
    Number.parseFloat(formatCostAmount(cost)) * 100,
  );
  const baseCents = Math.floor(totalCents / count);
  let remainder = totalCents - baseCents * count;

  return Array.from({ length: count }, () => {
    const cents = baseCents + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    return (cents / 100).toFixed(2);
  });
}

export function buildEqualSplitUsersBody(
  paidByUserId: number,
  participantIds: number[],
  cost: string,
): Record<string, string | number> {
  const participants = [...new Set(participantIds)];
  if (participants.length === 0) throw new Error("participants_required");

  const costFormatted = formatCostAmount(cost);
  const owedShares = equalOwedShares(costFormatted, participants.length);
  const owedByParticipant = new Map<number, string>();
  participants.forEach((id, index) => {
    owedByParticipant.set(id, owedShares[index]!);
  });

  const userIds = participants.includes(paidByUserId)
    ? participants
    : [paidByUserId, ...participants];

  const body: Record<string, string | number> = {};
  userIds.forEach((userId, index) => {
    body[`users__${index}__user_id`] = userId;
    body[`users__${index}__paid_share`] =
      userId === paidByUserId ? costFormatted : "0.00";
    body[`users__${index}__owed_share`] =
      owedByParticipant.get(userId) ?? "0.00";
  });

  return body;
}

export function canUseSplitEqually(
  allMemberIds: number[],
  participantIds: number[],
  paidByUserId: number,
  currentUserId: number,
): boolean {
  if (paidByUserId !== currentUserId) return false;
  if (participantIds.length !== allMemberIds.length) return false;

  const selected = new Set(participantIds);
  return allMemberIds.every((id) => selected.has(id));
}

export function parseExpenseSplitState(
  shares: Array<{
    splitwiseUserId: number;
    paidShare: string;
    owedShare: string;
  }>,
): { paidByUserId: number | null; participantIds: number[] } {
  let paidByUserId: number | null = null;
  let maxPaid = 0;

  for (const share of shares) {
    const paid = Number.parseFloat(share.paidShare);
    if (paid > maxPaid) {
      maxPaid = paid;
      paidByUserId = share.splitwiseUserId;
    }
  }

  const participantIds = shares
    .filter((s) => Number.parseFloat(s.owedShare) > 0)
    .map((s) => s.splitwiseUserId);

  return { paidByUserId, participantIds };
}

/** Splitwise settlement: payer paid full amount; payee's owed share records the payment. */
export function buildSettlementUsersBody(
  payerUserId: number,
  payeeUserId: number,
  cost: string,
): Record<string, string | number> {
  const costFormatted = formatCostAmount(cost);
  return {
    users__0__user_id: payerUserId,
    users__0__paid_share: costFormatted,
    users__0__owed_share: "0.00",
    users__1__user_id: payeeUserId,
    users__1__paid_share: "0.00",
    users__1__owed_share: costFormatted,
  };
}

function distributeProportionalCents(
  totalCents: number,
  weights: number[],
): string[] {
  if (weights.length === 0) throw new Error("participants_required");
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weightSum <= 0) throw new Error("invalid_split");

  const raw = weights.map((w) => (totalCents * w) / weightSum);
  const floors = raw.map((v) => Math.floor(v));
  let remainder = totalCents - floors.reduce((sum, v) => sum + v, 0);

  const order = raw
    .map((v, index) => ({ index, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const cents = [...floors];
  for (const { index } of order) {
    if (remainder <= 0) break;
    cents[index]! += 1;
    remainder--;
  }

  return cents.map((c) => (c / 100).toFixed(2));
}

function owedSharesForMode(
  cost: string,
  participantIds: number[],
  mode: SplitMode,
  memberSplits: MemberSplitInput[],
): string[] {
  const costFormatted = formatCostAmount(cost);
  const totalCents = Math.round(Number.parseFloat(costFormatted) * 100);
  const valueByUser = new Map(
    memberSplits.map((m) => [m.userId, m.value.trim()]),
  );

  if (mode === "equal") {
    return equalOwedShares(costFormatted, participantIds.length);
  }

  if (mode === "exact") {
    const amounts = participantIds.map((id) => {
      const raw = valueByUser.get(id);
      if (!raw) throw new Error("invalid_split");
      return formatCostAmount(raw);
    });
    const sumCents = amounts.reduce(
      (sum, amount) => sum + Math.round(Number.parseFloat(amount) * 100),
      0,
    );
    if (sumCents !== totalCents) throw new Error("split_total_mismatch");
    return amounts;
  }

  if (mode === "percent") {
    const percents = participantIds.map((id) => {
      const raw = valueByUser.get(id);
      const n = Number.parseFloat(raw ?? "");
      if (!Number.isFinite(n) || n < 0) throw new Error("invalid_split");
      return n;
    });
    const percentSum = percents.reduce((sum, p) => sum + p, 0);
    if (Math.abs(percentSum - 100) > 0.01)
      throw new Error("split_total_mismatch");
    return distributeProportionalCents(totalCents, percents);
  }

  if (mode === "shares") {
    const shares = participantIds.map((id) => {
      const raw = valueByUser.get(id);
      const n = Number.parseFloat(raw ?? "");
      if (!Number.isFinite(n) || n <= 0) throw new Error("invalid_split");
      return n;
    });
    return distributeProportionalCents(totalCents, shares);
  }

  throw new Error("invalid_split");
}

export function buildCustomSplitUsersBody(
  paidByUserId: number,
  participantIds: number[],
  cost: string,
  mode: SplitMode,
  memberSplits: MemberSplitInput[],
): Record<string, string | number> {
  const participants = [...new Set(participantIds)];
  if (participants.length === 0) throw new Error("participants_required");

  const costFormatted = formatCostAmount(cost);
  const owedShares = owedSharesForMode(
    costFormatted,
    participants,
    mode,
    memberSplits,
  );
  const owedByParticipant = new Map<number, string>();
  participants.forEach((id, index) => {
    owedByParticipant.set(id, owedShares[index]!);
  });

  const userIds = participants.includes(paidByUserId)
    ? participants
    : [paidByUserId, ...participants];

  const body: Record<string, string | number> = {};
  userIds.forEach((userId, index) => {
    body[`users__${index}__user_id`] = userId;
    body[`users__${index}__paid_share`] =
      userId === paidByUserId ? costFormatted : "0.00";
    body[`users__${index}__owed_share`] =
      owedByParticipant.get(userId) ?? "0.00";
  });

  return body;
}
