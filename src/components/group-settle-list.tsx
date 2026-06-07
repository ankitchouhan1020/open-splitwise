"use client";

import { HomeFeedRowActions } from "@/components/home-feed-row";
import { HomeFeedSectionHeader } from "@/components/home-feed-section-header";
import { useDemoMode } from "@/components/demo-mode-provider";
import type {
  SettleUpGroupContext,
  SettleUpInitial,
} from "@/components/settle-up-provider";
import { balanceClasses } from "@/lib/balance-style";
import { exploreFriendHref } from "@/lib/expenses/filters";
import { formatMoney, formatRelativeSync } from "@/lib/format";
import type { GroupSettleEntry } from "@/lib/groups/settle-balances";
import { useGroupSettlePage } from "@/lib/query/hooks";
import { ui } from "@/lib/ui-classes";
import { DataList } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  group: SettleUpGroupContext;
  onSelectMember: (initial: SettleUpInitial) => void;
};

function memberRowSubline(
  entry: GroupSettleEntry,
  direction: "to_get" | "to_pay",
): string {
  const parts: string[] = [];

  if (entry.expenseCount > 0) {
    parts.push(
      `${entry.expenseCount} expense${entry.expenseCount === 1 ? "" : "s"}`,
    );
  }
  if (entry.lastActivityAt) {
    parts.push(formatRelativeSync(entry.lastActivityAt));
  }
  if (parts.length > 0) return parts.join(" · ");

  return direction === "to_get"
    ? "Owes you in this group"
    : "You owe in this group";
}

function memberSectionHeading(
  entries: GroupSettleEntry[],
  direction: "to_get" | "to_pay",
  currency: string,
): string {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const countLabel = `${entries.length} ${entries.length === 1 ? "person" : "people"}`;
  const formatted = formatMoney(total, currency);

  if (direction === "to_get") {
    return `You're owed ${formatted} · ${countLabel}`;
  }
  return `You owe ${formatted} · ${countLabel}`;
}

function SettleMemberButton({
  entry,
  disabled,
  onClick,
}: {
  entry: GroupSettleEntry;
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
      aria-label={`Settle up with ${entry.name} in this group`}
    >
      Settle
    </button>
  );
}

function renderMemberRow(
  entry: GroupSettleEntry,
  direction: "to_get" | "to_pay",
  group: SettleUpGroupContext,
  currency: string,
  demoMode: boolean,
  onSelect: (entry: GroupSettleEntry, direction: "to_get" | "to_pay") => void,
) {
  const tag = direction === "to_get" ? "you_are_owed" : "you_owe";
  const styles = balanceClasses(tag);
  const amount = formatMoney(entry.amount, currency);

  return (
    <HomeFeedRowActions
      flushX
      stripe={tag}
      href={exploreFriendHref(entry.userId, {
        currency,
        groupId: group.groupId,
      })}
      ariaLabel={`View expenses with ${entry.name} in ${group.groupName}, ${direction === "to_get" ? "owes you" : "you owe"} ${amount}`}
      title={entry.name}
      subline={memberRowSubline(entry, direction)}
      amount={amount}
      amountClassName={styles.amount}
      action={
        <SettleMemberButton
          entry={entry}
          disabled={demoMode}
          onClick={() => onSelect(entry, direction)}
        />
      }
    />
  );
}

export function GroupSettleList({ group, onSelectMember }: Props) {
  const demoMode = useDemoMode();
  const query = useGroupSettlePage(group.groupId, true);
  const currency = query.data?.currency ?? group.currency;

  if (query.isLoading) {
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

  if (query.isError || !query.data) {
    return (
      <EmptyState compact>
        Could not load group balances. Try syncing from Settings.
      </EmptyState>
    );
  }

  const owedList = query.data.toGet;
  const oweList = query.data.toPay;

  if (owedList.length === 0 && oweList.length === 0) {
    return (
      <EmptyState compact>
        Everyone is settled up in {group.groupName}.
      </EmptyState>
    );
  }

  function openMemberSettle(
    entry: GroupSettleEntry,
    direction: "to_get" | "to_pay",
  ) {
    onSelectMember({
      friendUserId: entry.userId,
      friendName: entry.name,
      direction: direction === "to_pay" ? "you_pay" : "they_pay_you",
      amount: entry.amount,
      currency,
      groupId: group.groupId,
      groupName: group.groupName,
    });
  }

  const owedSectionHeading = memberSectionHeading(owedList, "to_get", currency);
  const oweSectionHeading = memberSectionHeading(oweList, "to_pay", currency);

  return (
    <div className="space-y-4 pb-2">
      {owedList.length > 0 ? (
        <section aria-label={owedSectionHeading}>
          <HomeFeedSectionHeader label={owedSectionHeading} variant="summary" />
          <DataList variant="flush">
            {owedList.map((entry) => (
              <li key={`to_get-${entry.userId}`}>
                {renderMemberRow(
                  entry,
                  "to_get",
                  group,
                  currency,
                  demoMode,
                  openMemberSettle,
                )}
              </li>
            ))}
          </DataList>
        </section>
      ) : null}
      {oweList.length > 0 ? (
        <section aria-label={oweSectionHeading}>
          <HomeFeedSectionHeader label={oweSectionHeading} variant="summary" />
          <DataList variant="flush">
            {oweList.map((entry) => (
              <li key={`to_pay-${entry.userId}`}>
                {renderMemberRow(
                  entry,
                  "to_pay",
                  group,
                  currency,
                  demoMode,
                  openMemberSettle,
                )}
              </li>
            ))}
          </DataList>
        </section>
      ) : null}
    </div>
  );
}
