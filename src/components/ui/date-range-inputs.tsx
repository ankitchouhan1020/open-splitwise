"use client";

import { ui } from "@/lib/ui-classes";
import {
  expenseDateFromIso,
  expenseDateInputValue,
  expenseDateToIso,
} from "@/lib/expenses/date-filters";

type Props = {
  dateFrom?: string;
  dateTo?: string;
  onChange: (patch: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
  }) => void;
};

export function ExpenseDateRangeInputs({ dateFrom, dateTo, onChange }: Props) {
  const fromValue = expenseDateInputValue(dateFrom);
  const toValue = expenseDateInputValue(dateTo);

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="date"
        value={fromValue}
        max={toValue || undefined}
        onChange={(e) =>
          onChange({
            dateFrom: e.target.value
              ? expenseDateFromIso(e.target.value)
              : undefined,
            page: 1,
          })
        }
        className={ui.dateInput}
        aria-label="From date"
      />
      <span className="text-muted text-xs">–</span>
      <input
        type="date"
        value={toValue}
        min={fromValue || undefined}
        onChange={(e) =>
          onChange({
            dateTo: e.target.value
              ? expenseDateToIso(e.target.value)
              : undefined,
            page: 1,
          })
        }
        className={ui.dateInput}
        aria-label="To date"
      />
    </span>
  );
}
