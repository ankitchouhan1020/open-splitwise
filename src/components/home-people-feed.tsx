"use client";

import {
  HomeFeedRowActionsClick,
  HomeFeedRowButton,
} from "@/components/home-feed-row";
import { HomeFeedSectionHeader } from "@/components/home-feed-section-header";
import { useDemoMode } from "@/components/demo-mode-provider";
import { useSettleUpDialogOptional } from "@/components/settle-up-provider";
import {
  balanceClasses,
  type BalanceTag,
  type RowStripe,
} from "@/lib/balance-style";
import {
  balanceRowSubline,
  groupSettledSectionHeading,
  groupUnsettledSectionHeading,
} from "@/lib/balance-row-copy";
import type { FriendBalanceEntry } from "@/lib/splitwise/balances";
import { formatMoney, formatRelativeSync } from "@/lib/format";
import type { GroupListItem } from "@/lib/groups/list";
import { useFriendsBalances, useGroupsList } from "@/lib/query/hooks";
import { ui } from "@/lib/ui-classes";
import { DataList } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";

type Scope = "people" | "groups";

const EPS = 0.005;

function netBalanceTag(net: number): BalanceTag | null {
  if (Math.abs(net) < EPS) return null;
  return net > 0 ? "you_are_owed" : "you_owe";
}

function peopleRowSubline(
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

function groupActivitySubline(group: GroupListItem): string {
  const expenseLabel = `${group.expenseCount} expense${group.expenseCount === 1 ? "" : "s"}`;
  const activityLabel = group.lastActivityAt
    ? formatRelativeSync(group.lastActivityAt)
    : "No recent activity";
  return balanceRowSubline(expenseLabel, activityLabel);
}

type GroupRowDisplay = {
  title: string;
  titleClassName: string;
  subline: string;
  amount?: string;
  amountClassName: string;
  hint: string;
  hintClassName: string;
  stripe: RowStripe;
  tag: BalanceTag | null;
};

function groupRowDisplay(
  group: GroupListItem,
  currency: string,
): GroupRowDisplay {
  const net = Number(group.netBalance);
  const tag = netBalanceTag(net);
  const share = formatMoney(Number(group.myShareTotal), currency);
  const activitySubline = groupActivitySubline(group);
  const expenseLabel = `${group.expenseCount} expense${group.expenseCount === 1 ? "" : "s"}`;

  if (tag) {
    const styles = balanceClasses(tag);
    return {
      title: group.name,
      titleClassName: "text-foreground",
      subline: balanceRowSubline(
        expenseLabel,
        activitySubline,
        `${share} your share`,
      ),
      amount: formatMoney(Math.abs(net), currency),
      amountClassName: styles.amount,
      hint: tag === "you_are_owed" ? "Owed to you" : "You owe",
      hintClassName: styles.label,
      stripe: tag,
      tag,
    };
  }

  return {
    title: group.name,
    titleClassName: "text-foreground",
    subline: activitySubline,
    amount: share,
    amountClassName: "text-foreground",
    hint: "Settled up",
    hintClassName: "text-muted",
    stripe: "settled",
    tag: null,
  };
}

type HomePeopleFeedProps = {
  scope: Scope;
  idPrefix?: string;
  onOpenGroup?: (group: GroupListItem) => void;
  onOpenFriend?: (friend: FriendBalanceEntry) => void;
};

function SettleUpButton({
  friend,
  disabled,
  onClick,
}: {
  friend: FriendBalanceEntry;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`${ui.btnSecondary} inline-flex h-9 shrink-0 items-center justify-center px-3 text-xs`}
      aria-label={`Settle up with ${friend.name}`}
    >
      Settle
    </button>
  );
}

function GroupSettleButton({
  groupName,
  disabled,
  onClick,
}: {
  groupName: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`${ui.btnSecondary} inline-flex h-9 shrink-0 items-center justify-center px-3 text-xs`}
      aria-label={`Settle up in ${groupName}`}
    >
      Settle
    </button>
  );
}

function groupIsSettled(group: GroupListItem): boolean {
  return netBalanceTag(Number(group.netBalance)) == null;
}

function sortUnsettledGroups(groups: GroupListItem[]): GroupListItem[] {
  return [...groups].sort(
    (a, b) =>
      Math.abs(Number(b.netBalance)) - Math.abs(Number(a.netBalance)) ||
      (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""),
  );
}

function sortSettledGroups(groups: GroupListItem[]): GroupListItem[] {
  return [...groups].sort(
    (a, b) =>
      (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "") ||
      a.name.localeCompare(b.name),
  );
}

export function HomePeopleFeed({
  scope,
  idPrefix = "",
  onOpenGroup,
  onOpenFriend,
}: HomePeopleFeedProps) {
  const demoMode = useDemoMode();
  const settleUp = useSettleUpDialogOptional();
  const friendsQuery = useFriendsBalances();
  const groupsQuery = useGroupsList();
  const groupsOnly = scope === "groups";
  const resultsId = `${idPrefix}home-${scope}-results`;

  const loading = friendsQuery.isLoading || groupsQuery.isLoading;

  if (loading) {
    return (
      <ul className={ui.listFlush} aria-busy="true">
        {[1, 2, 3].map((i) => (
          <li key={i} aria-hidden>
            <div className="bg-muted-surface/40 min-h-[60px] animate-pulse" />
          </li>
        ))}
      </ul>
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

  function openSettleUp(
    friend: FriendBalanceEntry,
    direction: "to_get" | "to_pay",
  ) {
    settleUp?.openSettleUp({
      friendUserId: friend.id,
      friendName: friend.name,
      direction: direction === "to_pay" ? "you_pay" : "they_pay_you",
      amount: friend.amount,
      currency,
    });
  }

  function openGroupSettleUp(group: GroupListItem) {
    settleUp?.openGroupSettleUp({
      groupId: group.id,
      groupName: group.name,
      currency,
    });
  }

  function renderUnsettledGroupRow(g: GroupListItem) {
    const row = groupRowDisplay(g, currency);
    const balanceNote =
      row.tag === "you_are_owed"
        ? `you are owed ${formatMoney(Math.abs(Number(g.netBalance)), currency)}`
        : `you owe ${formatMoney(Math.abs(Number(g.netBalance)), currency)}`;

    return (
      <HomeFeedRowActionsClick
        flushX
        stripe={row.stripe}
        onRowClick={() => onOpenGroup?.(g)}
        ariaLabel={`View activity in ${g.name}, ${balanceNote}`}
        title={row.title}
        titleClassName={row.titleClassName}
        subline={row.subline}
        amount={row.amount}
        amountClassName={row.amountClassName}
        action={
          settleUp ? (
            <GroupSettleButton
              groupName={g.name}
              disabled={demoMode}
              onClick={() => openGroupSettleUp(g)}
            />
          ) : null
        }
      />
    );
  }

  function renderSettledGroupRow(g: GroupListItem) {
    const row = groupRowDisplay(g, currency);

    return (
      <HomeFeedRowButton
        flushX
        stripe={row.stripe}
        onClick={() => onOpenGroup?.(g)}
        ariaLabel={`View activity in ${g.name}, settled up`}
        title={row.title}
        titleClassName={row.titleClassName}
        subline={row.subline}
        amount={row.amount}
        amountClassName={row.amountClassName}
        hint={row.hint}
        hintClassName={row.hintClassName}
      />
    );
  }

  const unsettledGroups = sortUnsettledGroups(
    groupList.filter((g) => !groupIsSettled(g)),
  );
  const settledGroups = sortSettledGroups(
    groupList.filter((g) => groupIsSettled(g)),
  );
  const unsettledSectionHeading = groupUnsettledSectionHeading(
    unsettledGroups,
    currency,
  );
  const settledSectionHeading = groupSettledSectionHeading(
    settledGroups.length,
  );

  return (
    <div id={resultsId} aria-live="polite">
      {!groupsOnly ? (
        <DataList variant="flush">
          {owedList.length > 0
            ? owedList.map((f) => {
                const amount = formatMoney(f.amount, currency);
                return (
                  <li key={`owed-${f.id}`}>
                    <HomeFeedRowActionsClick
                      flushX
                      stripe="you_are_owed"
                      onRowClick={() => onOpenFriend?.(f)}
                      ariaLabel={`View activity with ${f.name}, owes you ${amount}`}
                      title={f.name}
                      subline={peopleRowSubline(f, "to_get", currency)}
                      amount={amount}
                      amountClassName={balanceClasses("you_are_owed").amount}
                      action={
                        settleUp ? (
                          <SettleUpButton
                            friend={f}
                            disabled={demoMode}
                            onClick={() => openSettleUp(f, "to_get")}
                          />
                        ) : null
                      }
                    />
                  </li>
                );
              })
            : null}
          {oweList.length > 0
            ? oweList.map((f) => {
                const amount = formatMoney(f.amount, currency);
                return (
                  <li key={`owe-${f.id}`}>
                    <HomeFeedRowActionsClick
                      flushX
                      stripe="you_owe"
                      onRowClick={() => onOpenFriend?.(f)}
                      ariaLabel={`View activity with ${f.name}, you owe ${amount}`}
                      title={f.name}
                      subline={peopleRowSubline(f, "to_pay", currency)}
                      amount={amount}
                      amountClassName={balanceClasses("you_owe").amount}
                      action={
                        settleUp ? (
                          <SettleUpButton
                            friend={f}
                            disabled={demoMode}
                            onClick={() => openSettleUp(f, "to_pay")}
                          />
                        ) : null
                      }
                    />
                  </li>
                );
              })
            : null}
        </DataList>
      ) : (
        <div className="space-y-4">
          {unsettledGroups.length > 0 ? (
            <section aria-label={unsettledSectionHeading}>
              <HomeFeedSectionHeader
                label={unsettledSectionHeading}
                variant="summary"
              />
              <DataList variant="flush">
                {unsettledGroups.map((g) => (
                  <li key={`group-${g.id}`}>{renderUnsettledGroupRow(g)}</li>
                ))}
              </DataList>
            </section>
          ) : null}
          {settledGroups.length > 0 ? (
            <section aria-label={settledSectionHeading}>
              <HomeFeedSectionHeader
                label={settledSectionHeading}
                variant="summary"
              />
              <DataList variant="flush">
                {settledGroups.map((g) => (
                  <li key={`group-${g.id}`}>{renderSettledGroupRow(g)}</li>
                ))}
              </DataList>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
