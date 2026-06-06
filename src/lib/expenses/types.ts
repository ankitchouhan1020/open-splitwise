export type ExpenseListItem = {
  id: number;
  splitwiseId: number;
  date: string;
  /** Last change from Splitwise sync (used for activity ordering). */
  updatedAt: string;
  description: string;
  details: string | null;
  groupId: number | null;
  groupName: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryIconUrl: string | null;
  categoryIconBg: string | null;
  cost: string;
  currencyCode: string;
  myShare: string | null;
  myPaidShare: string | null;
  paidBy: string;
  /** On settlements: participant who received the payment (max owed share). */
  paidTo: string;
  payment: boolean;
};

export type ExpenseDetail = ExpenseListItem & {
  groupId: number | null;
  categoryId: number | null;
  friendshipId: number | null;
  comments: string | null;
  shares: Array<{
    splitwiseUserId: number;
    name: string;
    paidShare: string;
    owedShare: string;
    netBalance: string | null;
  }>;
  /** Server-only Splitwise payload; omitted from API responses in production. */
  raw?: unknown;
};
