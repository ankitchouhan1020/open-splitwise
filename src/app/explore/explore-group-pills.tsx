"use client";

import type { ExploreGroupStat } from "@/lib/expenses/explore-context";

type Props = {
  groups: ExploreGroupStat[];
  activeGroupId?: number;
  onSelectGroup: (groupId: number | undefined) => void;
};

export function ExploreGroupPills({
  groups,
  activeGroupId,
  onSelectGroup,
}: Props) {
  if (groups.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {groups.slice(0, 10).map((g) => {
        const active = activeGroupId === g.groupId;
        return (
          <button
            key={g.groupId}
            type="button"
            onClick={() => onSelectGroup(active ? undefined : g.groupId)}
            title={`${g.expenseCount} expenses`}
            className={
              active
                ? "bg-accent text-accent-foreground shrink-0 rounded-md px-2.5 py-1 text-xs font-medium"
                : "border-border bg-card hover:bg-hover shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium"
            }
          >
            {g.groupName}
            <span
              className={
                active ? "text-balance-get/70 ml-1" : "text-muted ml-1"
              }
            >
              {g.expenseCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
