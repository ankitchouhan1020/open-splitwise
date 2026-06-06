import type { ExpenseDetail, ExpenseListItem } from "@/lib/expenses/types";
import type { BalanceSummary } from "@/lib/splitwise/balances";
import { DEMO_OWNER_SPLITWISE_ID } from "@/lib/demo/user";

export const DEMO_GROUPS = [
  { id: 1001, name: "Roommates" },
  { id: 1002, name: "Portland weekend" },
  { id: 1003, name: "Office lunch club" },
] as const;

export const DEMO_FRIENDS = [
  { id: 3001, name: "Jordan Lee" },
  { id: 3002, name: "Sam Patel" },
  { id: 3003, name: "Taylor Kim" },
] as const;

export const DEMO_CATEGORIES = [
  { id: 2001, name: "Groceries", iconBg: "#E8F5E9" },
  { id: 2002, name: "Restaurants", iconBg: "#FFF3E0" },
  { id: 2003, name: "Transportation", iconBg: "#E3F2FD" },
  { id: 2004, name: "Entertainment", iconBg: "#F3E5F5" },
  { id: 2005, name: "Utilities", iconBg: "#ECEFF1" },
] as const;

type SeedExpense = {
  id: number;
  splitwiseId: number;
  daysAgo: number;
  date: string;
  description: string;
  details?: string;
  groupId: number | null;
  groupName: string;
  categoryId: number | null;
  categoryName: string | null;
  cost: string;
  myShare: string;
  paidBy: string;
  payment?: boolean;
  shares: ExpenseDetail["shares"];
};

function payeeFromShares(shares: SeedExpense["shares"]): string {
  let bestOwed = 0;
  let payee = "—";
  for (const share of shares) {
    const owed = Number(share.owedShare);
    if (owed > bestOwed + 0.005) {
      bestOwed = owed;
      payee = share.name;
    }
  }
  return payee;
}

function daysAgoIso(daysAgo: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function categoryMeta(categoryId: number | null) {
  const cat = DEMO_CATEGORIES.find((c) => c.id === categoryId);
  return {
    categoryName: cat?.name ?? null,
    categoryIconUrl: null,
    categoryIconBg: cat?.iconBg ?? null,
  };
}

function buildSeedExpenses(now = new Date()): SeedExpense[] {
  return [
    {
      id: 1,
      splitwiseId: 50001,
      daysAgo: 2,
      description: "Trader Joe's run",
      groupId: 1001,
      groupName: "Roommates",
      categoryId: 2001,
      categoryName: "Groceries",
      cost: "86.40",
      myShare: "28.80",
      paidBy: "Jordan Lee",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "28.80",
          netBalance: "-28.80",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "86.40",
          owedShare: "28.80",
          netBalance: "57.60",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "28.80",
          netBalance: "-28.80",
        },
      ],
    },
    {
      id: 2,
      splitwiseId: 50002,
      daysAgo: 4,
      description: "Brunch at Sunny Side",
      groupId: 1003,
      groupName: "Office lunch club",
      categoryId: 2002,
      categoryName: "Restaurants",
      cost: "124.50",
      myShare: "24.90",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "124.50",
          owedShare: "24.90",
          netBalance: "99.60",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "24.90",
          netBalance: "-24.90",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "0.00",
          owedShare: "24.90",
          netBalance: "-24.90",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "24.90",
          netBalance: "-24.90",
        },
        {
          splitwiseUserId: 900_002,
          name: "Casey Nguyen",
          paidShare: "0.00",
          owedShare: "24.90",
          netBalance: "-24.90",
        },
      ],
    },
    {
      id: 3,
      splitwiseId: 50003,
      daysAgo: 6,
      description: "Lyft to airport",
      groupId: 1002,
      groupName: "Portland weekend",
      categoryId: 2003,
      categoryName: "Transportation",
      cost: "42.00",
      myShare: "14.00",
      paidBy: "Taylor Kim",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "14.00",
          netBalance: "-14.00",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "42.00",
          owedShare: "14.00",
          netBalance: "28.00",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "14.00",
          netBalance: "-14.00",
        },
      ],
    },
    {
      id: 4,
      splitwiseId: 50004,
      daysAgo: 8,
      description: "Electric bill",
      groupId: 1001,
      groupName: "Roommates",
      categoryId: 2005,
      categoryName: "Utilities",
      cost: "156.00",
      myShare: "52.00",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "156.00",
          owedShare: "52.00",
          netBalance: "104.00",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "52.00",
          netBalance: "-52.00",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "52.00",
          netBalance: "-52.00",
        },
      ],
    },
    {
      id: 5,
      splitwiseId: 50005,
      daysAgo: 11,
      description: "Concert tickets",
      groupId: 1002,
      groupName: "Portland weekend",
      categoryId: 2004,
      categoryName: "Entertainment",
      cost: "180.00",
      myShare: "60.00",
      paidBy: "Jordan Lee",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "60.00",
          netBalance: "-60.00",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "180.00",
          owedShare: "60.00",
          netBalance: "120.00",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "0.00",
          owedShare: "60.00",
          netBalance: "-60.00",
        },
      ],
    },
    {
      id: 6,
      splitwiseId: 50006,
      daysAgo: 14,
      description: "Coffee catch-up",
      groupId: null,
      groupName: "No group",
      categoryId: 2002,
      categoryName: "Restaurants",
      cost: "18.50",
      myShare: "9.25",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "18.50",
          owedShare: "9.25",
          netBalance: "9.25",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "9.25",
          netBalance: "-9.25",
        },
      ],
    },
    {
      id: 7,
      splitwiseId: 50007,
      daysAgo: 18,
      description: "Costco stock-up",
      groupId: 1001,
      groupName: "Roommates",
      categoryId: 2001,
      categoryName: "Groceries",
      cost: "214.30",
      myShare: "71.43",
      paidBy: "Sam Patel",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "71.43",
          netBalance: "-71.43",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "214.30",
          owedShare: "71.43",
          netBalance: "142.87",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "71.44",
          netBalance: "-71.44",
        },
      ],
    },
    {
      id: 8,
      splitwiseId: 50008,
      daysAgo: 22,
      description: "Team tacos",
      groupId: 1003,
      groupName: "Office lunch club",
      categoryId: 2002,
      categoryName: "Restaurants",
      cost: "96.00",
      myShare: "19.20",
      paidBy: "Taylor Kim",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "19.20",
          netBalance: "-19.20",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "96.00",
          owedShare: "19.20",
          netBalance: "76.80",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "19.20",
          netBalance: "-19.20",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "19.20",
          netBalance: "-19.20",
        },
        {
          splitwiseUserId: 900_002,
          name: "Casey Nguyen",
          paidShare: "0.00",
          owedShare: "19.20",
          netBalance: "-19.20",
        },
      ],
    },
    {
      id: 9,
      splitwiseId: 50009,
      daysAgo: 28,
      description: "Bus passes",
      groupId: 1002,
      groupName: "Portland weekend",
      categoryId: 2003,
      categoryName: "Transportation",
      cost: "36.00",
      myShare: "12.00",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "36.00",
          owedShare: "12.00",
          netBalance: "24.00",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "12.00",
          netBalance: "-12.00",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "0.00",
          owedShare: "12.00",
          netBalance: "-12.00",
        },
      ],
    },
    {
      id: 10,
      splitwiseId: 50010,
      daysAgo: 35,
      description: "Internet",
      groupId: 1001,
      groupName: "Roommates",
      categoryId: 2005,
      categoryName: "Utilities",
      cost: "89.99",
      myShare: "30.00",
      paidBy: "Jordan Lee",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "30.00",
          netBalance: "-30.00",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "89.99",
          owedShare: "30.00",
          netBalance: "59.99",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "29.99",
          netBalance: "-29.99",
        },
      ],
    },
    {
      id: 11,
      splitwiseId: 50011,
      daysAgo: 42,
      description: "Brewery tour",
      groupId: 1002,
      groupName: "Portland weekend",
      categoryId: 2004,
      categoryName: "Entertainment",
      cost: "72.00",
      myShare: "24.00",
      paidBy: "Taylor Kim",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "24.00",
          netBalance: "-24.00",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "72.00",
          owedShare: "24.00",
          netBalance: "48.00",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "24.00",
          netBalance: "-24.00",
        },
      ],
    },
    {
      id: 12,
      splitwiseId: 50012,
      daysAgo: 48,
      description: "Farmers market",
      groupId: 1001,
      groupName: "Roommates",
      categoryId: 2001,
      categoryName: "Groceries",
      cost: "54.20",
      myShare: "18.07",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "54.20",
          owedShare: "18.07",
          netBalance: "36.13",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "18.07",
          netBalance: "-18.07",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "18.06",
          netBalance: "-18.06",
        },
      ],
    },
    {
      id: 13,
      splitwiseId: 50013,
      daysAgo: 55,
      description: "Sushi lunch",
      groupId: 1003,
      groupName: "Office lunch club",
      categoryId: 2002,
      categoryName: "Restaurants",
      cost: "142.00",
      myShare: "28.40",
      paidBy: "Sam Patel",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "28.40",
          netBalance: "-28.40",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "142.00",
          owedShare: "28.40",
          netBalance: "113.60",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "0.00",
          owedShare: "28.40",
          netBalance: "-28.40",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "28.40",
          netBalance: "-28.40",
        },
        {
          splitwiseUserId: 900_002,
          name: "Casey Nguyen",
          paidShare: "0.00",
          owedShare: "28.40",
          netBalance: "-28.40",
        },
      ],
    },
    {
      id: 14,
      splitwiseId: 50014,
      daysAgo: 62,
      description: "Parking downtown",
      details: "Split for Saturday errands",
      groupId: null,
      groupName: "No group",
      categoryId: 2003,
      categoryName: "Transportation",
      cost: "24.00",
      myShare: "12.00",
      paidBy: "Jordan Lee",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "12.00",
          netBalance: "-12.00",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "24.00",
          owedShare: "12.00",
          netBalance: "12.00",
        },
      ],
    },
    {
      id: 15,
      splitwiseId: 50015,
      daysAgo: 75,
      description: "Board game night snacks",
      groupId: 1002,
      groupName: "Portland weekend",
      categoryId: 2004,
      categoryName: "Entertainment",
      cost: "48.50",
      myShare: "16.17",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "48.50",
          owedShare: "16.17",
          netBalance: "32.33",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "16.17",
          netBalance: "-16.17",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "0.00",
          owedShare: "16.16",
          netBalance: "-16.16",
        },
      ],
    },
    {
      id: 16,
      splitwiseId: 50016,
      daysAgo: 88,
      description: "Water & trash",
      groupId: 1001,
      groupName: "Roommates",
      categoryId: 2005,
      categoryName: "Utilities",
      cost: "112.00",
      myShare: "37.33",
      paidBy: "Sam Patel",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "37.33",
          netBalance: "-37.33",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "112.00",
          owedShare: "37.33",
          netBalance: "74.67",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "37.34",
          netBalance: "-37.34",
        },
      ],
    },
    {
      id: 17,
      splitwiseId: 50017,
      daysAgo: 95,
      description: "Thai takeout",
      groupId: 1003,
      groupName: "Office lunch club",
      categoryId: 2002,
      categoryName: "Restaurants",
      cost: "88.00",
      myShare: "17.60",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "88.00",
          owedShare: "17.60",
          netBalance: "70.40",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "17.60",
          netBalance: "-17.60",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "0.00",
          owedShare: "17.60",
          netBalance: "-17.60",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "17.60",
          netBalance: "-17.60",
        },
        {
          splitwiseUserId: 900_002,
          name: "Casey Nguyen",
          paidShare: "0.00",
          owedShare: "17.60",
          netBalance: "-17.60",
        },
      ],
    },
    {
      id: 18,
      splitwiseId: 50018,
      daysAgo: 110,
      description: "Gas for road trip",
      groupId: 1002,
      groupName: "Portland weekend",
      categoryId: 2003,
      categoryName: "Transportation",
      cost: "68.00",
      myShare: "22.67",
      paidBy: "Jordan Lee",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "22.67",
          netBalance: "-22.67",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "68.00",
          owedShare: "22.67",
          netBalance: "45.33",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "0.00",
          owedShare: "22.66",
          netBalance: "-22.66",
        },
      ],
    },
    {
      id: 19,
      splitwiseId: 50019,
      daysAgo: 125,
      description: "Movie night",
      groupId: null,
      groupName: "No group",
      categoryId: 2004,
      categoryName: "Entertainment",
      cost: "32.00",
      myShare: "16.00",
      paidBy: "Taylor Kim",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "0.00",
          owedShare: "16.00",
          netBalance: "-16.00",
        },
        {
          splitwiseUserId: 3003,
          name: "Taylor Kim",
          paidShare: "32.00",
          owedShare: "16.00",
          netBalance: "16.00",
        },
      ],
    },
    {
      id: 20,
      splitwiseId: 50020,
      daysAgo: 140,
      description: "Weekly groceries",
      groupId: 1001,
      groupName: "Roommates",
      categoryId: 2001,
      categoryName: "Groceries",
      cost: "98.75",
      myShare: "32.92",
      paidBy: "Alex Morgan",
      shares: [
        {
          splitwiseUserId: DEMO_OWNER_SPLITWISE_ID,
          name: "Alex Morgan",
          paidShare: "98.75",
          owedShare: "32.92",
          netBalance: "65.83",
        },
        {
          splitwiseUserId: 3001,
          name: "Jordan Lee",
          paidShare: "0.00",
          owedShare: "32.92",
          netBalance: "-32.92",
        },
        {
          splitwiseUserId: 3002,
          name: "Sam Patel",
          paidShare: "0.00",
          owedShare: "32.91",
          netBalance: "-32.91",
        },
      ],
    },
  ].map((row) => ({
    ...row,
    date: daysAgoIso(row.daysAgo, now),
  }));
}

let cachedNow: Date | null = null;
let cachedList: ExpenseListItem[] | null = null;
let cachedDetails: Map<number, ExpenseDetail> | null = null;

function refreshCache(now = new Date()) {
  if (
    cachedNow &&
    cachedList &&
    cachedDetails &&
    cachedNow.toDateString() === now.toDateString()
  ) {
    return;
  }
  cachedNow = now;
  const seeds = buildSeedExpenses(now);
  cachedList = seeds.map((seed) => {
    const meta = categoryMeta(seed.categoryId);
    return {
      id: seed.id,
      splitwiseId: seed.splitwiseId,
      date: seed.date,
      updatedAt: seed.date,
      description: seed.description,
      details: seed.details ?? null,
      groupId: seed.groupId,
      groupName: seed.groupName,
      categoryId: seed.categoryId,
      categoryName: meta.categoryName,
      categoryIconUrl: meta.categoryIconUrl,
      categoryIconBg: meta.categoryIconBg,
      cost: seed.cost,
      currencyCode: "USD",
      myShare: seed.myShare,
      myPaidShare:
        seed.shares.find((s) => s.splitwiseUserId === DEMO_OWNER_SPLITWISE_ID)
          ?.paidShare ?? "0.00",
      paidBy: seed.paidBy,
      paidTo: payeeFromShares(seed.shares),
      payment: seed.payment ?? false,
    };
  });
  cachedDetails = new Map(
    seeds.map((seed) => {
      const list = cachedList!.find((e) => e.id === seed.id)!;
      const detail: ExpenseDetail = {
        ...list,
        friendshipId: seed.groupId ? null : 3001,
        comments: null,
        shares: seed.shares,
        raw: { demo: true },
      };
      return [seed.id, detail] as const;
    }),
  );
}

export function getDemoExpenses(now = new Date()): ExpenseListItem[] {
  refreshCache(now);
  return cachedList!;
}

export function getDemoExpenseDetail(
  expenseId: number,
  now = new Date(),
): ExpenseDetail | null {
  refreshCache(now);
  return cachedDetails!.get(expenseId) ?? null;
}

export const DEMO_BALANCES: BalanceSummary = {
  currency: "USD",
  youAreOwed: 142.5,
  youOwe: 89.25,
  net: 53.25,
  topOwedToYou: [
    { name: "Sam Patel", amount: 65.83 },
    { name: "Jordan Lee", amount: 9.25 },
  ],
  topYouOwe: [
    { name: "Taylor Kim", amount: 36.0 },
    { name: "Jordan Lee", amount: 28.8 },
  ],
};
