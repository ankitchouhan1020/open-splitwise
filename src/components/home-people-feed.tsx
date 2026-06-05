"use client";

import { HomeFeedRowLink } from "@/components/home-feed-row";
import { balanceClasses, type BalanceTag } from "@/lib/balance-style";
import type { FriendBalanceEntry } from "@/lib/splitwise/balances";
import {
  peopleFriendExploreHref,
  peopleGroupExploreHref,
} from "@/lib/expenses/filters";
import { formatMoney, formatRelativeSync } from "@/lib/format";
import type { GroupListItem } from "@/lib/groups/list";
import { useFriendsBalances, useGroupsList } from "@/lib/query/hooks";
import { DataList } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ui } from "@/lib/ui-classes";

type Scope = "people" | "groups";

const EPS = 0.005;

function netBalanceTag(net: number): BalanceTag | null {
  if (Math.abs(net) < EPS) return null;
  return net > 0 ? "you_are_owed" : "you_owe";
}

function friendSubline(
  friend: FriendBalanceEntry,
  direction: "to_get" | "to_pay",
  currency: string,
): string {
  const parts: string[] = [];

  if (friend.expenseCount != null && friend.expenseCount > 0) {
    parts.push(
      `${friend.expenseCount} expense${friend.expenseCount === 1 ? "" : "s"}`,
    );
  }
  if (friend.lastActivityAt) {
    parts.push(formatRelativeSync(friend.lastActivityAt));
  }
  if (friend.myShareTotal != null && Number(friend.myShareTotal) > EPS) {
    parts.push(
      `${formatMoney(Number(friend.myShareTotal), currency)} your share`,
    );
  }

  if (parts.length > 0) return parts.join(" · ");

  return direction === "to_get"
    ? "Owes you · live Splitwise balance"
    : "You owe · live Splitwise balance";
}

function groupRowMeta(
  group: GroupListItem,
  currency: string,
): {
  subline: string;
  amount: string;
  amountClassName: string;
  hint: string;
  hintClassName: string;
} {
  const expenseLabel = `${group.expenseCount} expense${group.expenseCount === 1 ? "" : "s"}`;
  const activityLabel = group.lastActivityAt
    ? formatRelativeSync(group.lastActivityAt)
    : "No recent activity";
  const share = formatMoney(Number(group.myShareTotal), currency);
  const net = Number(group.netBalance);
  const tag = netBalanceTag(net);

  if (tag) {
    const styles = balanceClasses(tag);
    return {
      subline: `${expenseLabel} · ${activityLabel} · ${share} your share`,
      amount: formatMoney(Math.abs(net), currency),
      amountClassName: styles.amount,
      hint: tag === "you_are_owed" ? "Owed to you" : "You owe",
      hintClassName: styles.label,
    };
  }

  return {
    subline: `${expenseLabel} · ${activityLabel}`,
    amount: share,
    amountClassName: "text-foreground",
    hint: "Settled up",
    hintClassName: "text-muted",
  };
}

type HomePeopleFeedProps = {
  scope: Scope;
  idPrefix?: string;
};

export function HomePeopleFeed({ scope, idPrefix = "" }: HomePeopleFeedProps) {
  const friendsQuery = useFriendsBalances();
  const groupsQuery = useGroupsList();
  const groupsOnly = scope === "groups";
  const resultsId = `${idPrefix}home-${scope}-results`;

  const loading = friendsQuery.isLoading || groupsQuery.isLoading;

  if (loading) {
    return (
      <div className={ui.listFlush} aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted-surface/40 min-h-[60px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const friendsError = friendsQuery.isError || !friendsQuery.data;
  const groupsError = groupsQuery.isError || !groupsQuery.data;

  if (groupsOnly && groupsError) {
    return (
      <EmptyState compact>
        Could not load groups. Try syncing from Settings.
      </EmptyState>
    );
  }

  if (friendsError && groupsError) {
    return (
      <EmptyState variant="dashed">
        Could not load balances or groups. Try syncing or reconnecting
        Splitwise.
      </EmptyState>
    );
  }

  const friends = friendsQuery.data;
  const groups = groupsQuery.data;
  const currency = friends?.currency ?? groups?.currency ?? "USD";

  const owedList = groupsOnly ? [] : (friends?.toGet ?? []);
  const oweList = groupsOnly ? [] : (friends?.toPay ?? []);
  const groupList = groupsOnly
    ? (groups?.groups ?? []).filter((g) => g.expenseCount > 0)
    : [];

  const hasBalances = owedList.length > 0 || oweList.length > 0;
  const hasGroups = groupList.length > 0;
  const hasVisibleContent = groupsOnly ? hasGroups : hasBalances;

  if (!hasVisibleContent) {
    return (
      <EmptyState compact>
        {groupsOnly
          ? "No active groups yet. Run a full sync from Settings."
          : "All settled up."}
      </EmptyState>
    );
  }

  return (
    <div id={resultsId} aria-live="polite">
      <DataList variant="flush">
        {!groupsOnly && owedList.length > 0
          ? owedList.map((f) => {
              const amount = formatMoney(f.amount, currency);
              return (
                <li key={`owed-${f.id}`}>
                  <HomeFeedRowLink
                    flushX
                    stripe="you_are_owed"
                    href={peopleFriendExploreHref(f.id, currency)}
                    ariaLabel={`View expenses with ${f.name}, owes you ${amount}`}
                    title={f.name}
                    subline={friendSubline(f, "to_get", currency)}
                    amount={amount}
                    amountClassName={balanceClasses("you_are_owed").amount}
                    hint="Owed to you"
                    hintClassName={balanceClasses("you_are_owed").label}
                  />
                </li>
              );
            })
          : null}
        {!groupsOnly && oweList.length > 0
          ? oweList.map((f) => {
              const amount = formatMoney(f.amount, currency);
              return (
                <li key={`owe-${f.id}`}>
                  <HomeFeedRowLink
                    flushX
                    stripe="you_owe"
                    href={peopleFriendExploreHref(f.id, currency)}
                    ariaLabel={`View expenses with ${f.name}, you owe ${amount}`}
                    title={f.name}
                    subline={friendSubline(f, "to_pay", currency)}
                    amount={amount}
                    amountClassName={balanceClasses("you_owe").amount}
                    hint="You owe"
                    hintClassName={balanceClasses("you_owe").label}
                  />
                </li>
              );
            })
          : null}
        {groupsOnly && hasGroups
          ? groupList.map((g) => {
              const meta = groupRowMeta(g, currency);
              const net = Number(g.netBalance);
              const tag = netBalanceTag(net);
              const balanceNote = tag
                ? tag === "you_are_owed"
                  ? `owed to you ${meta.amount}`
                  : `you owe ${meta.amount}`
                : "settled up";
              return (
                <li key={`group-${g.id}`}>
                  <HomeFeedRowLink
                    flushX
                    stripe={tag ?? "settled"}
                    href={peopleGroupExploreHref(g.id, currency)}
                    ariaLabel={`View expenses in ${g.name}, ${balanceNote}`}
                    title={g.name}
                    subline={meta.subline}
                    amount={meta.amount}
                    amountClassName={meta.amountClassName}
                    hint={meta.hint}
                    hintClassName={meta.hintClassName}
                  />
                </li>
              );
            })
          : null}
      </DataList>
    </div>
  );
}
