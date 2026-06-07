"use client";

import { useExpenseFormOptions } from "@/components/use-expense-form-options";
import type { ExpenseTarget } from "@/components/expense-form-target-section";
import type { SplitMode } from "@/lib/expenses/split-types";
import { useFilterOptions } from "@/lib/query/hooks";
import { useCallback, useEffect, useRef, useState } from "react";

function defaultSplitValues(
  mode: SplitMode,
  participantIds: number[],
): Record<number, string> {
  if (mode === "equal" || participantIds.length === 0) return {};
  if (mode === "percent") {
    const each = (100 / participantIds.length).toFixed(2);
    return Object.fromEntries(participantIds.map((id) => [id, each]));
  }
  if (mode === "shares") {
    return Object.fromEntries(participantIds.map((id) => [id, "1"]));
  }
  return {};
}

export function useExpenseFormDefaults() {
  const {
    loading,
    groups,
    categories,
    currencies,
    suggestions,
    defaultGroup,
    defaultCurrency,
  } = useExpenseFormOptions();
  const optionsQuery = useFilterOptions();

  const [target, setTarget] = useState<ExpenseTarget>("group");
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [friendUserId, setFriendUserId] = useState("");
  const [friendName, setFriendName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [paidByUserId, setPaidByUserId] = useState<number | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [memberSplitValues, setMemberSplitValues] = useState<
    Record<number, string>
  >({});
  const defaultGroupApplied = useRef(false);

  const friends = (optionsQuery.data?.friends ?? []).filter((f) => f.id > 0);
  const ownerUserId = optionsQuery.data?.ownerUserId ?? 0;
  const ownerName = optionsQuery.data?.ownerName ?? "You";

  useEffect(() => {
    if (loading) return;
    if (defaultGroup && !defaultGroupApplied.current) {
      setGroupId(String(defaultGroup.id));
      setGroupName(defaultGroup.name);
      defaultGroupApplied.current = true;
    }
    setCurrencyCode(defaultCurrency);
  }, [loading, defaultGroup, defaultCurrency]);

  useEffect(() => {
    if (target !== "friend" || !friendUserId || !ownerUserId) return;
    setParticipantIds([ownerUserId, Number(friendUserId)]);
    if (paidByUserId == null) setPaidByUserId(ownerUserId);
  }, [target, friendUserId, ownerUserId, paidByUserId]);

  useEffect(() => {
    if (splitMode === "equal") return;
    setMemberSplitValues((prev) => {
      const next = { ...prev };
      for (const id of participantIds) {
        if (next[id] == null || next[id] === "") {
          next[id] = defaultSplitValues(splitMode, [id])[id] ?? "";
        }
      }
      return next;
    });
  }, [splitMode, participantIds]);

  const onGroupChange = useCallback((id: string, name: string) => {
    setGroupId(id);
    if (id) setGroupName(name);
    setParticipantIds([]);
    setPaidByUserId(null);
  }, []);

  const onFriendChange = useCallback((id: string, name: string) => {
    setFriendUserId(id);
    setFriendName(name);
    setParticipantIds([]);
    setPaidByUserId(null);
  }, []);

  const onTargetChange = useCallback((next: ExpenseTarget) => {
    setTarget(next);
    setParticipantIds([]);
    setPaidByUserId(null);
    setSplitMode("equal");
    setMemberSplitValues({});
  }, []);

  const onSplitModeChange = useCallback(
    (mode: SplitMode) => {
      setSplitMode(mode);
      setMemberSplitValues(defaultSplitValues(mode, participantIds));
    },
    [participantIds],
  );

  const onMemberSplitChange = useCallback((userId: number, value: string) => {
    setMemberSplitValues((prev) => ({ ...prev, [userId]: value }));
  }, []);

  const memberSplits =
    splitMode === "equal"
      ? undefined
      : participantIds
          .map((userId) => ({
            userId,
            value: memberSplitValues[userId] ?? "",
          }))
          .filter((entry) => entry.value.trim());

  const splitPayload =
    participantIds.length > 0 ||
    paidByUserId != null ||
    splitMode !== "equal" ||
    (memberSplits?.length ?? 0) > 0
      ? {
          participantIds:
            participantIds.length > 0 ? participantIds : undefined,
          paidByUserId: paidByUserId ?? undefined,
          splitMode,
          memberSplits,
        }
      : {};

  const hasTarget =
    target === "group"
      ? Boolean(groupId)
      : Boolean(friendUserId && ownerUserId);

  return {
    loading: loading || optionsQuery.isLoading,
    groups,
    friends,
    categories,
    currencies,
    suggestions,
    target,
    setTarget: onTargetChange,
    groupId,
    groupName,
    friendUserId,
    friendName,
    ownerUserId,
    ownerName,
    currencyCode,
    setCurrencyCode,
    participantIds,
    setParticipantIds,
    paidByUserId,
    setPaidByUserId,
    splitMode,
    onSplitModeChange,
    memberSplitValues,
    onMemberSplitChange,
    onGroupChange,
    onFriendChange,
    splitPayload,
    hasTarget,
  };
}
