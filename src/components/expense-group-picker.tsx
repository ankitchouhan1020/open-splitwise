"use client";

import type { ExpenseFormGroup } from "@/components/use-expense-form-options";
import {
  expenseInputClass,
  expenseLabelClass,
} from "@/components/expense-form-styles";
import { useMemo } from "react";

type Props = {
  groups: ExpenseFormGroup[];
  topGroups: Array<{ id: number; name: string }>;
  groupId: string;
  onGroupChange: (groupId: string, groupName: string) => void;
};

export function ExpenseGroupPicker({
  groups,
  topGroups,
  groupId,
  onGroupChange,
}: Props) {
  const sortedGroups = useMemo(() => {
    const recentIds = new Set(topGroups.map((g) => g.id));
    const recent = topGroups
      .map((g) => groups.find((x) => x.id === g.id) ?? g)
      .filter(Boolean) as ExpenseFormGroup[];
    const rest = groups.filter((g) => !recentIds.has(g.id));
    return [...recent, ...rest];
  }, [groups, topGroups]);

  return (
    <div className="space-y-1.5">
      <label htmlFor="expense-group" className={expenseLabelClass}>
        With
      </label>
      <select
        id="expense-group"
        required
        value={groupId}
        onChange={(e) => {
          const id = e.target.value;
          const group = groups.find((g) => String(g.id) === id);
          onGroupChange(id, group?.name ?? "");
        }}
        className={expenseInputClass}
      >
        <option value="">Select group…</option>
        {sortedGroups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
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
        className={compact ? `${expenseInputClass} py-2` : expenseInputClass}
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
      className={`${expenseInputClass} uppercase`}
    />
  );
}
