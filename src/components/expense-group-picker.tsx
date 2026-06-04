"use client";

import type { ExpenseFormGroup } from "@/components/use-expense-form-options";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const inputClass =
  "border-border focus:border-accent focus:ring-accent/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2";

type Props = {
  groups: ExpenseFormGroup[];
  topGroups: Array<{ id: number; name: string; count: number }>;
  groupId: string;
  onGroupChange: (groupId: string, groupName: string) => void;
};

export function ExpenseGroupPicker({
  groups,
  topGroups,
  groupId,
  onGroupChange,
}: Props) {
  const [groupQuery, setGroupQuery] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  const selectedGroup = groups.find((g) => String(g.id) === groupId);

  useEffect(() => {
    if (selectedGroup) setGroupQuery(selectedGroup.name);
  }, [selectedGroup]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setGroupOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filteredGroups = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    const sorted = [...groups];
    if (!q) return sorted.slice(0, 8);
    return sorted.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 8);
  }, [groupQuery, groups]);

  const pickGroup = useCallback(
    (g: ExpenseFormGroup) => {
      onGroupChange(String(g.id), g.name);
      setGroupQuery(g.name);
      setGroupOpen(false);
    },
    [onGroupChange],
  );

  return (
    <div className="space-y-2">
      <span className="text-foreground text-sm font-medium">Group</span>
      {topGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topGroups.map((g) => {
            const active = groupId === String(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => pickGroup({ id: g.id, name: g.name })}
                className={
                  active
                    ? "rounded-md bg-teal-700 px-2.5 py-1 text-xs font-medium text-white"
                    : "border-border rounded-md border bg-white px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
                }
              >
                {g.name}
              </button>
            );
          })}
        </div>
      )}
      <div ref={groupRef} className="relative">
        <input
          autoComplete="off"
          placeholder="Or search groups…"
          value={groupOpen ? groupQuery : (selectedGroup?.name ?? groupQuery)}
          onChange={(e) => {
            setGroupQuery(e.target.value);
            onGroupChange("", e.target.value);
            setGroupOpen(true);
          }}
          onFocus={() => setGroupOpen(true)}
          className={inputClass}
        />
        {groupOpen && filteredGroups.length > 0 && (
          <ul className="border-border bg-card absolute top-full z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border py-1 shadow-lg">
            {filteredGroups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                  onClick={() => pickGroup(g)}
                >
                  {g.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ExpenseCurrencySelect({
  currencies,
  currencyCode,
  onChange,
  compact = false,
}: {
  currencies: string[];
  currencyCode: string;
  onChange: (code: string) => void;
  compact?: boolean;
}) {
  if (currencies.length > 0) {
    return (
      <select
        required
        value={currencyCode}
        onChange={(e) => onChange(e.target.value)}
        className={compact ? `${inputClass} py-2` : inputClass}
      >
        {currencies.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      required
      value={currencyCode}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className={`${inputClass} uppercase`}
    />
  );
}
