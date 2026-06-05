"use client";

import { ExpenseGroupPicker } from "@/components/expense-group-picker";
import { ExpenseParticipantPicker } from "@/components/expense-participant-picker";
import type { ExpenseFormGroup } from "@/components/use-expense-form-options";

type Props = {
  groups: ExpenseFormGroup[];
  topGroups: Array<{ id: number; name: string }>;
  groupId: string;
  onGroupChange: (id: string, name: string) => void;
  participantIds: number[];
  onParticipantChange: (ids: number[]) => void;
  paidByUserId: number | null;
  onPaidByChange: (id: number) => void;
  splitCompact?: boolean;
  showSplit?: boolean;
};

export function ExpenseFormGroupSection({
  groups,
  topGroups,
  groupId,
  onGroupChange,
  participantIds,
  onParticipantChange,
  paidByUserId,
  onPaidByChange,
  splitCompact = false,
  showSplit = true,
}: Props) {
  return (
    <>
      <ExpenseGroupPicker
        groups={groups}
        topGroups={topGroups}
        groupId={groupId}
        onGroupChange={onGroupChange}
      />
      {showSplit && groupId ? (
        <ExpenseParticipantPicker
          groupId={groupId}
          selectedIds={participantIds}
          onSelectedChange={onParticipantChange}
          paidByUserId={paidByUserId}
          onPaidByChange={onPaidByChange}
          compact={splitCompact}
        />
      ) : null}
    </>
  );
}
