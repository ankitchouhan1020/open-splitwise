"use client";

import { FilterPillButton } from "@/components/ui/filter-pills";
import type { ExploreGroupStat } from "@/lib/expenses/explore-context";

type Props = {
  groups: ExploreGroupStat[];
  activeGroupId?: number;
  onSelectGroup: (groupId: number | undefined) => void;
  size?: "sm" | "md";
};

export function ExploreGroupPills({
  groups,
  activeGroupId,
  onSelectGroup,
  size = "md",
}: Props) {
  if (groups.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {groups.slice(0, 10).map((g) => {
        const active = activeGroupId === g.groupId;
        return (
          <FilterPillButton
            key={g.groupId}
            active={active}
            onClick={() => onSelectGroup(active ? undefined : g.groupId)}
            title={`${g.expenseCount} expenses`}
            size={size}
          >
            {g.groupName}
          </FilterPillButton>
        );
      })}
    </div>
  );
}
