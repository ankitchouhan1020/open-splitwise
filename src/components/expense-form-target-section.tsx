"use client";

import { ExpenseFormGroupSection } from "@/components/expense-form-group-section";
import {
  expenseInputClass,
  expenseLabelClass,
} from "@/components/expense-form-styles";
import type { ExpenseMember } from "@/components/expense-participant-picker";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import type { ExpenseFormGroup } from "@/components/use-expense-form-options";

export type ExpenseTarget = "group" | "friend";

type Props = {
  target: ExpenseTarget;
  onTargetChange: (target: ExpenseTarget) => void;
  groups: ExpenseFormGroup[];
  topGroups: Array<{ id: number; name: string }>;
  groupId: string;
  onGroupChange: (id: string, name: string) => void;
  friends: Array<{ id: number; name: string }>;
  friendUserId: string;
  onFriendChange: (id: string, name: string) => void;
  participantIds: number[];
  onParticipantChange: (ids: number[]) => void;
  paidByUserId: number | null;
  onPaidByChange: (id: number) => void;
};

const TARGET_TABS: { id: ExpenseTarget; label: string }[] = [
  { id: "group", label: "Group" },
  { id: "friend", label: "Friend" },
];

export function ExpenseFormTargetSection({
  target,
  onTargetChange,
  groups,
  topGroups,
  groupId,
  onGroupChange,
  friends,
  friendUserId,
  onFriendChange,
  participantIds,
  onParticipantChange,
  paidByUserId,
  onPaidByChange,
}: Props) {
  return (
    <div className="space-y-4">
      <SegmentTabs
        tabs={TARGET_TABS}
        activeId={target}
        onChange={onTargetChange}
        ariaLabel="Expense type"
        panelId="expense-target-panel"
        idPrefix="expense-target-"
      />

      {target === "group" ? (
        <ExpenseFormGroupSection
          groups={groups}
          topGroups={topGroups}
          groupId={groupId}
          onGroupChange={onGroupChange}
          participantIds={participantIds}
          onParticipantChange={onParticipantChange}
          paidByUserId={paidByUserId}
          onPaidByChange={onPaidByChange}
          showSplit={false}
        />
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="expense-friend" className={expenseLabelClass}>
            With
          </label>
          <select
            id="expense-friend"
            required
            value={friendUserId}
            onChange={(e) => {
              const id = e.target.value;
              const friend = friends.find((f) => String(f.id) === id);
              onFriendChange(id, friend?.name ?? "");
            }}
            className={expenseInputClass}
          >
            <option value="">Select friend…</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function friendExpenseMembers(
  ownerUserId: number,
  ownerName: string,
  friendUserId: number,
  friendName: string,
): ExpenseMember[] {
  return [
    { id: ownerUserId, name: ownerName },
    { id: friendUserId, name: friendName },
  ];
}
