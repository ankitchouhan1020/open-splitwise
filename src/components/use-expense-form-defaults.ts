"use client";

import { useExpenseFormOptions } from "@/components/use-expense-form-options";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [paidByUserId, setPaidByUserId] = useState<number | null>(null);
  const defaultGroupApplied = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (defaultGroup && !defaultGroupApplied.current) {
      setGroupId(String(defaultGroup.id));
      setGroupName(defaultGroup.name);
      defaultGroupApplied.current = true;
    }
    setCurrencyCode(defaultCurrency);
  }, [loading, defaultGroup, defaultCurrency]);

  const onGroupChange = useCallback((id: string, name: string) => {
    setGroupId(id);
    if (id) setGroupName(name);
    setParticipantIds([]);
    setPaidByUserId(null);
  }, []);

  const splitPayload =
    participantIds.length > 0 || paidByUserId != null
      ? {
          participantIds:
            participantIds.length > 0 ? participantIds : undefined,
          paidByUserId: paidByUserId ?? undefined,
        }
      : {};

  return {
    loading,
    groups,
    categories,
    currencies,
    suggestions,
    groupId,
    groupName,
    currencyCode,
    setCurrencyCode,
    participantIds,
    setParticipantIds,
    paidByUserId,
    setPaidByUserId,
    onGroupChange,
    splitPayload,
  };
}
