"use client";

import {
  expenseInputClass,
  expenseLabelClass,
} from "@/components/expense-form-styles";
import type { SplitMode } from "@/lib/expenses/split-types";
import { SPLIT_MODE_LABELS } from "@/lib/expenses/split-types";
import { useGroupMembers } from "@/lib/query/hooks";
import { ui } from "@/lib/ui-classes";
import { useEffect, useMemo, useState } from "react";

const selectClass = expenseInputClass;

export type ExpenseMember = { id: number; name: string };

type Props = {
  groupId?: string;
  members?: ExpenseMember[];
  currentUserId?: number | null;
  selectedIds: number[];
  onSelectedChange: (ids: number[]) => void;
  paidByUserId: number | null;
  onPaidByChange: (id: number) => void;
  splitMode?: SplitMode;
  onSplitModeChange?: (mode: SplitMode) => void;
  memberSplitValues?: Record<number, string>;
  onMemberSplitChange?: (userId: number, value: string) => void;
  skipEmptyDefaults?: boolean;
  idPrefix?: string;
  compact?: boolean;
  embedded?: boolean;
  hideMemberPicker?: boolean;
};

const SPLIT_MODES: SplitMode[] = ["equal", "exact", "percent", "shares"];

function splitValueLabel(mode: SplitMode): string {
  if (mode === "exact") return "Owed";
  if (mode === "percent") return "%";
  return "Shares";
}

export function ExpenseParticipantPicker({
  groupId,
  members: membersOverride,
  currentUserId: currentUserIdOverride,
  selectedIds,
  onSelectedChange,
  paidByUserId,
  onPaidByChange,
  splitMode = "equal",
  onSplitModeChange,
  memberSplitValues = {},
  onMemberSplitChange,
  skipEmptyDefaults = false,
  idPrefix = "",
  compact = false,
  embedded = false,
  hideMemberPicker = false,
}: Props) {
  const [splitOpen, setSplitOpen] = useState(embedded);
  const numericGroupId = groupId ? Number(groupId) : null;
  const groupQuery = useGroupMembers(membersOverride ? null : numericGroupId);

  const members = useMemo(
    () => membersOverride ?? groupQuery.data?.members ?? [],
    [membersOverride, groupQuery.data?.members],
  );
  const currentUserId =
    currentUserIdOverride ?? groupQuery.data?.currentUserId ?? null;
  const isLoading = membersOverride ? false : groupQuery.isLoading;
  const isError = membersOverride ? false : groupQuery.isError;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedMembers = useMemo(
    () => members.filter((m) => selectedSet.has(m.id)),
    [members, selectedSet],
  );

  useEffect(() => {
    if (members.length === 0) return;
    if (selectedIds.length === 0 && !skipEmptyDefaults) {
      onSelectedChange(members.map((m) => m.id));
    }
    if (paidByUserId == null && currentUserId != null && !skipEmptyDefaults) {
      onPaidByChange(currentUserId);
    }
  }, [
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

  const hasTarget = Boolean(groupId || membersOverride?.length);
  if (!hasTarget) return null;

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
  const showAdvancedSplit =
    selectedIds.length > 1 && Boolean(onSplitModeChange);

  function memberDisplayName(member: ExpenseMember): string {
    return member.id === currentUserId ? `${member.name} (you)` : member.name;
  }

  function splitUnitHint(mode: SplitMode): string {
    if (mode === "exact") return "Amount owed";
    if (mode === "percent") return "Percent";
    return "Shares";
  }

  function splitSummary(): string {
    const paidLabel = youPaid ? "You paid" : `${payerName} paid`;
    if (splitMode !== "equal") {
      return `${paidLabel} · ${SPLIT_MODE_LABELS[splitMode].toLowerCase()}`;
    }
    if (allSelected) return `${paidLabel}, split equally`;
    return `${paidLabel}, ${selectedIds.length} people`;
  }

  function toggleMember(id: number) {
    if (hideMemberPicker && members.length <= 2) return;
    const next = selectedSet.has(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    if (next.length === 0) return;
    onSelectedChange(next);
  }

  const memberChips = hideMemberPicker ? null : (
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

  const splitShortcuts = hideMemberPicker ? null : (
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

  const splitModePicker = showAdvancedSplit ? (
    <div className="col-span-2 space-y-2">
      <span className="text-muted text-sm">Split method</span>
      <div className="flex flex-wrap gap-1.5">
        {SPLIT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSplitModeChange?.(mode)}
            className={splitMode === mode ? ui.pillActive : ui.pill}
          >
            {SPLIT_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const customSplitInputs =
    showAdvancedSplit && splitMode !== "equal" ? (
      <div className="col-span-2 space-y-3">
        {selectedMembers.map((member) => {
          const inputId = `${idPrefix}split-${member.id}`;
          return (
            <div key={member.id} className="space-y-1.5">
              <label htmlFor={inputId} className={expenseLabelClass}>
                {memberDisplayName(member)}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={inputId}
                  type="number"
                  inputMode="decimal"
                  step={splitMode === "shares" ? "1" : "0.01"}
                  min="0"
                  value={memberSplitValues[member.id] ?? ""}
                  onChange={(e) =>
                    onMemberSplitChange?.(member.id, e.target.value)
                  }
                  className={`${expenseInputClass} py-2 text-sm tabular-nums`}
                  aria-label={`${splitUnitHint(splitMode)} for ${member.name}`}
                  placeholder={splitMode === "percent" ? "0" : "0.00"}
                />
                <span className="text-muted w-14 shrink-0 text-xs">
                  {splitValueLabel(splitMode)}
                </span>
              </div>
            </div>
          );
        })}
        <p className="text-muted text-xs leading-relaxed">
          {splitMode === "exact"
            ? "Owed amounts must add up to the total."
            : splitMode === "percent"
              ? "Percentages must add up to 100."
              : "Share counts split the total proportionally."}
        </p>
      </div>
    ) : null;

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
      {!hideMemberPicker && (
        <>
          <div className="col-span-2 flex items-center justify-between gap-2">
            <span className="text-muted text-sm">Split</span>
            {splitShortcuts}
          </div>
          <div className="col-span-2">{memberChips}</div>
        </>
      )}
      {splitModePicker}
      {customSplitInputs}
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

      {!hideMemberPicker && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={expenseLabelClass}>Split with</span>
            {splitShortcuts}
          </div>
          {memberChips}
        </div>
      )}

      {splitModePicker}
      {customSplitInputs}
    </div>
  );

  if (embedded) {
    return (
      <div className="border-border border-t px-4 py-4 sm:px-5">
        {splitContent}
      </div>
    );
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
