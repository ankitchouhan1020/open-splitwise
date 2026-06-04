"use client";

import { useGroupMembers } from "@/lib/query/hooks";
import { useEffect, useMemo } from "react";

const labelClass = "text-foreground text-sm font-medium";

type Props = {
  groupId: string;
  selectedIds: number[];
  onSelectedChange: (ids: number[]) => void;
  paidByUserId: number | null;
  onPaidByChange: (id: number) => void;
};

export function ExpenseParticipantPicker({
  groupId,
  selectedIds,
  onSelectedChange,
  paidByUserId,
  onPaidByChange,
}: Props) {
  const numericGroupId = groupId ? Number(groupId) : null;
  const { data, isLoading, isError } = useGroupMembers(numericGroupId);

  const members = useMemo(() => data?.members ?? [], [data?.members]);
  const currentUserId = data?.currentUserId ?? null;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    if (!data || members.length === 0) return;
    if (selectedIds.length === 0) {
      onSelectedChange(members.map((m) => m.id));
    }
    if (paidByUserId == null && currentUserId != null) {
      onPaidByChange(currentUserId);
    }
  }, [
    data,
    members,
    selectedIds.length,
    paidByUserId,
    currentUserId,
    onSelectedChange,
    onPaidByChange,
  ]);

  useEffect(() => {
    if (paidByUserId == null || selectedSet.has(paidByUserId)) return;
    const fallback = selectedIds[0] ?? currentUserId;
    if (fallback != null) onPaidByChange(fallback);
  }, [paidByUserId, selectedSet, selectedIds, currentUserId, onPaidByChange]);

  if (!groupId) return null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <span className={labelClass}>Split with</span>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-border h-7 w-20 animate-pulse rounded-md border bg-stone-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || members.length === 0) {
    return (
      <p className="text-muted text-xs">
        Could not load group members. The expense will split equally with
        everyone in the group.
      </p>
    );
  }

  const allSelected = members.every((m) => selectedSet.has(m.id));
  const payerOptions = members.filter((m) => selectedSet.has(m.id));

  function toggleMember(id: number) {
    const next = selectedSet.has(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    if (next.length === 0) return;
    onSelectedChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>Split with</span>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => onSelectedChange(members.map((m) => m.id))}
              disabled={allSelected}
              className="text-muted hover:text-foreground font-medium disabled:opacity-40"
            >
              Everyone
            </button>
            <button
              type="button"
              onClick={() => {
                const self =
                  currentUserId != null &&
                  members.some((m) => m.id === currentUserId)
                    ? currentUserId
                    : members[0]!.id;
                onSelectedChange([self]);
              }}
              disabled={selectedIds.length === 1}
              className="text-muted hover:text-foreground font-medium disabled:opacity-40"
            >
              Just me
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => {
            const active = selectedSet.has(m.id);
            const isYou = m.id === currentUserId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={
                  active
                    ? "rounded-md bg-stone-800 px-2.5 py-1 text-xs font-medium text-white"
                    : "border-border rounded-md border bg-white px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
                }
              >
                {m.name}
                {isYou ? " (you)" : ""}
              </button>
            );
          })}
        </div>
        {selectedIds.length < members.length && (
          <p className="text-muted text-xs">
            Splitting equally among {selectedIds.length} of {members.length}{" "}
            people
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="expense-paid-by" className={labelClass}>
          Paid by
        </label>
        <select
          id="expense-paid-by"
          value={paidByUserId ?? ""}
          onChange={(e) => onPaidByChange(Number(e.target.value))}
          className="border-border focus:border-accent focus:ring-accent/20 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2"
        >
          {payerOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.id === currentUserId ? " (you)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
