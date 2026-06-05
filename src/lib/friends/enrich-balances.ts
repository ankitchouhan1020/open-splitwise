import type {
  FriendsBalancePage,
  FriendBalanceEntry,
} from "@/lib/splitwise/balances";

type FriendSyncedStat = {
  friendId: number;
  expenseCount: number;
  lastActivityAt: string | null;
  myShareTotal: string;
};

function enrichEntry(
  entry: FriendBalanceEntry,
  stats: Map<number, FriendSyncedStat>,
): FriendBalanceEntry {
  const stat = stats.get(entry.id);
  if (!stat) return entry;
  return {
    ...entry,
    expenseCount: stat.expenseCount,
    lastActivityAt: stat.lastActivityAt,
    myShareTotal: stat.myShareTotal,
  };
}

export function mergeFriendSyncedStats(
  page: FriendsBalancePage,
  stats: FriendSyncedStat[],
): FriendsBalancePage {
  const byId = new Map(stats.map((s) => [s.friendId, s]));
  return {
    ...page,
    toGet: page.toGet.map((e) => enrichEntry(e, byId)),
    toPay: page.toPay.map((e) => enrichEntry(e, byId)),
  };
}
