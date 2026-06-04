import { requireAccessToken } from "@/lib/auth";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import { SplitwiseAuthError } from "@/lib/splitwise/errors";

/** Splitwise friend balance entry from get_friends. */
type FriendBalance = {
  currency_code: string;
  amount: string;
};

type FriendWithBalance = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  balance?: FriendBalance[];
};

export type BalanceSummary = {
  currency: string;
  /** Total others owe you (positive friend balances). */
  youAreOwed: number;
  /** Total you owe others (absolute of negative friend balances). */
  youOwe: number;
  net: number;
  topOwedToYou: Array<{ name: string; amount: number }>;
  topYouOwe: Array<{ name: string; amount: number }>;
};

function friendName(f: FriendWithBalance): string {
  return (
    [f.first_name, f.last_name].filter(Boolean).join(" ") || `Friend #${f.id}`
  );
}

/**
 * Fetches live balances from Splitwise get_friends.
 * Splitwise convention: positive amount = they owe you; negative = you owe them.
 */
export async function getLiveBalanceSummary(
  defaultCurrency: string,
): Promise<BalanceSummary | null> {
  try {
    const token = await requireAccessToken();
    const client = createSplitwiseClient(token);
    const { friends } = await client.get<{ friends: FriendWithBalance[] }>(
      "get_friends",
    );

    let youAreOwed = 0;
    let youOwe = 0;
    const owedToYou: Array<{ name: string; amount: number }> = [];
    const youOweList: Array<{ name: string; amount: number }> = [];

    for (const friend of friends ?? []) {
      const entry = friend.balance?.find(
        (b) => b.currency_code === defaultCurrency,
      );
      if (!entry) continue;
      const amount = Number(entry.amount);
      if (Number.isNaN(amount) || amount === 0) continue;
      const name = friendName(friend);
      if (amount > 0) {
        youAreOwed += amount;
        owedToYou.push({ name, amount });
      } else {
        youOwe += Math.abs(amount);
        youOweList.push({ name, amount: Math.abs(amount) });
      }
    }

    owedToYou.sort((a, b) => b.amount - a.amount);
    youOweList.sort((a, b) => b.amount - a.amount);

    return {
      currency: defaultCurrency,
      youAreOwed,
      youOwe,
      net: youAreOwed - youOwe,
      topOwedToYou: owedToYou.slice(0, 3),
      topYouOwe: youOweList.slice(0, 3),
    };
  } catch (err) {
    if (err instanceof SplitwiseAuthError) return null;
    throw err;
  }
}
