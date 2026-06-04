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
  const uniqueIds = [...new Set(participantIds)];
  if (uniqueIds.length === 0) throw new Error("participants_required");
  if (!uniqueIds.includes(paidByUserId)) {
    throw new Error("payer_must_be_participant");
  }

  const costFormatted = formatCostAmount(cost);
  const owedShares = equalOwedShares(costFormatted, uniqueIds.length);
  const body: Record<string, string | number> = {};

  uniqueIds.forEach((userId, index) => {
    body[`users__${index}__user_id`] = userId;
    body[`users__${index}__paid_share`] =
      userId === paidByUserId ? costFormatted : "0.00";
    body[`users__${index}__owed_share`] = owedShares[index]!;
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
