export type ExpenseListItem = {
  id: number;
  splitwiseId: number;
  date: string;
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
  raw: unknown;
};
