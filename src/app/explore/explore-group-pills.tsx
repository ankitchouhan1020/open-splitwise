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
                ? "shrink-0 rounded-md bg-teal-700 px-2.5 py-1 text-xs font-medium text-white"
                : "border-border shrink-0 rounded-md border bg-white px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
            }
          >
            {g.groupName}
            <span className={active ? "ml-1 text-teal-200" : "text-muted ml-1"}>
              {g.expenseCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
