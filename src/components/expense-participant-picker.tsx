"use client";

import {
  expenseInputClass,
  expenseLabelClass,
} from "@/components/expense-form-styles";
import { useGroupMembers } from "@/lib/query/hooks";
import { useEffect, useMemo, useState } from "react";

const selectClass = expenseInputClass;

type Props = {
  groupId: string;
  selectedIds: number[];
  onSelectedChange: (ids: number[]) => void;
  paidByUserId: number | null;
  onPaidByChange: (id: number) => void;
  skipEmptyDefaults?: boolean;
  idPrefix?: string;
  compact?: boolean;
  embedded?: boolean;
};

export function ExpenseParticipantPicker({
  groupId,
  selectedIds,
  onSelectedChange,
  paidByUserId,
  onPaidByChange,
  skipEmptyDefaults = false,
  idPrefix = "",
  compact = false,
  embedded = false,
}: Props) {
  const [splitOpen, setSplitOpen] = useState(embedded);
  const numericGroupId = groupId ? Number(groupId) : null;
  const { data, isLoading, isError } = useGroupMembers(numericGroupId);

  const members = useMemo(() => data?.members ?? [], [data?.members]);
  const currentUserId = data?.currentUserId ?? null;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    if (!data || members.length === 0) return;
    if (selectedIds.length === 0 && !skipEmptyDefaults) {
      onSelectedChange(members.map((m) => m.id));
    }
    if (paidByUserId == null && currentUserId != null && !skipEmptyDefaults) {
      onPaidByChange(currentUserId);
    }
  }, [
    data,
    members,
    selectedIds.length,
    paidByUserId,
    currentUserId,
    skipEmptyDefaults,
    onSelectedChange,
    onPaidByChange,
  ]);

  useEffect(() => {
    if (!embedded) setSplitOpen(false);
  }, [groupId, embedded]);

  if (!groupId) return null;

  if (isLoading) {
    if (embedded || compact) {
      return (
        <div
          className={`border-border border-t px-4 py-4 sm:px-5 ${embedded ? "" : "border-b"}`}
          aria-busy
        >
          <div className="bg-muted-surface h-4 w-48 animate-pulse rounded" />
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="bg-muted-surface h-10 animate-pulse rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted-surface h-7 w-16 animate-pulse rounded-md"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || members.length === 0) {
    return (
      <p
        className={`text-muted border-border border-t px-4 py-3 text-xs sm:px-5 ${embedded ? "" : "border-b"}`}
      >
        Split defaults to everyone in the group.
      </p>
    );
  }

  const allSelected = members.every((m) => selectedSet.has(m.id));
  const payerIsInSplit = paidByUserId != null && selectedSet.has(paidByUserId);
  const payerName =
    members.find((m) => m.id === paidByUserId)?.name ?? "Someone";
  const youPaid = paidByUserId === currentUserId;

  function splitSummary(): string {
    const paidLabel = youPaid ? "You paid" : `${payerName} paid`;
    if (allSelected) return `${paidLabel}, split equally`;
    return `${paidLabel}, ${selectedIds.length} people`;
  }

  function toggleMember(id: number) {
    const next = selectedSet.has(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    if (next.length === 0) return;
    onSelectedChange(next);
  }

  if (compact && !splitOpen) {
    return (
      <button
        type="button"
        onClick={() => setSplitOpen(true)}
        className="border-border hover:bg-hover/50 flex w-full items-center gap-3 border-b py-3.5 text-left transition-colors"
      >
        <span className="text-muted w-20 shrink-0 text-sm">Split</span>
        <span className="text-foreground min-w-0 flex-1 truncate text-sm">
          {splitSummary()}
        </span>
        <span className="text-muted text-sm" aria-hidden>
          ›
        </span>
      </button>
    );
  }

  const memberChips = (
    <div className="flex flex-wrap gap-1.5">
      {members.map((m) => {
        const active = selectedSet.has(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggleMember(m.id)}
            className={
              active
                ? "bg-pill-active text-pill-active-fg rounded-md px-2.5 py-1 text-xs font-medium"
                : "border-border bg-card text-muted hover:text-foreground rounded-md border px-2.5 py-1 text-xs font-medium"
            }
          >
            {m.name}
            {m.id === currentUserId ? " (you)" : ""}
          </button>
        );
      })}
    </div>
  );

  const splitShortcuts = (
    <div className="flex gap-3 text-xs">
      <button
        type="button"
        onClick={() => onSelectedChange(members.map((m) => m.id))}
        disabled={allSelected}
        className="text-accent font-medium hover:underline disabled:opacity-40"
      >
        Everyone
      </button>
      <button
        type="button"
        onClick={() => {
          const self =
            currentUserId != null && members.some((m) => m.id === currentUserId)
              ? currentUserId
              : members[0]!.id;
          onSelectedChange([self]);
        }}
        disabled={selectedIds.length === 1}
        className="text-accent font-medium hover:underline disabled:opacity-40"
      >
        Just me
      </button>
    </div>
  );

  const splitContent = embedded ? (
    <div className="grid grid-cols-[4.5rem_1fr] items-start gap-x-3 gap-y-3">
      <label
        htmlFor={`${idPrefix}expense-paid-by`}
        className="text-muted pt-2.5 text-sm"
      >
        Paid by
      </label>
      <select
        id={`${idPrefix}expense-paid-by`}
        value={paidByUserId ?? ""}
        onChange={(e) => onPaidByChange(Number(e.target.value))}
        className={`${selectClass} py-2`}
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.id === currentUserId ? " (you)" : ""}
          </option>
        ))}
      </select>
      {!payerIsInSplit && paidByUserId != null && (
        <p className="text-muted col-span-2 text-xs">
          Payer is not included in this split.
        </p>
      )}
      <div className="col-span-2 flex items-center justify-between gap-2">
        <span className="text-muted text-sm">Split</span>
        {splitShortcuts}
      </div>
      <div className="col-span-2">{memberChips}</div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}expense-paid-by`}
          className={expenseLabelClass}
        >
          Paid by
        </label>
        <select
          id={`${idPrefix}expense-paid-by`}
          value={paidByUserId ?? ""}
          onChange={(e) => onPaidByChange(Number(e.target.value))}
          className={selectClass}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.id === currentUserId ? " (you)" : ""}
            </option>
          ))}
        </select>
        {!payerIsInSplit && paidByUserId != null && (
          <p className="text-muted text-xs">
            Payer is not included in this split.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className={expenseLabelClass}>Split with</span>
          {splitShortcuts}
        </div>
        {memberChips}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="border-border border-t px-4 py-4 sm:px-5">
        {splitContent}
      </div>
    );
  }

  return (
    <div className="border-border border-b py-4">
      {compact && (
        <div className="mb-3 flex items-center justify-between">
          <span className={expenseLabelClass}>Split</span>
          <button
            type="button"
            onClick={() => setSplitOpen(false)}
            className="text-accent text-sm font-medium hover:underline"
          >
            Done
          </button>
        </div>
      )}
      {splitContent}
    </div>
  );
}
