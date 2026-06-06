const EPS = 0.005;

export type ShareDirectionInput = {
  splitwiseUserId: number;
  paidShare: string;
  owedShare: string;
};

export type ExpenseShareDirection = {
  paidByUserId: number | null;
  paidToUserId: number | null;
};

/** Primary payer (max paid_share) and payee (max owed_share) on an expense. */
export function expenseShareDirection(
  shares: ShareDirectionInput[],
): ExpenseShareDirection {
  let paidByUserId: number | null = null;
  let paidToUserId: number | null = null;
  let maxPaid = 0;
  let maxOwed = 0;

  for (const share of shares) {
    const paid = Number.parseFloat(share.paidShare);
    const owed = Number.parseFloat(share.owedShare);
    if (paid > maxPaid + EPS) {
      maxPaid = paid;
      paidByUserId = share.splitwiseUserId;
    }
    if (owed > maxOwed + EPS) {
      maxOwed = owed;
      paidToUserId = share.splitwiseUserId;
    }
  }

  return { paidByUserId, paidToUserId };
}

export function matchesShareDirection(
  direction: ExpenseShareDirection,
  filters: {
    paidByUserId?: number;
    paidToUserId?: number;
  },
): boolean {
  if (
    filters.paidByUserId != null &&
    direction.paidByUserId !== filters.paidByUserId
  ) {
    return false;
  }
  if (
    filters.paidToUserId != null &&
    direction.paidToUserId !== filters.paidToUserId
  ) {
    return false;
  }
  return true;
}
