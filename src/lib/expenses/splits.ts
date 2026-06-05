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
