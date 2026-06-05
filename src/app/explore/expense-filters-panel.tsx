"use client";

import type { ReactNode } from "react";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import { ui } from "@/lib/ui-classes";

type FilterOptions = {
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
};

type Props = {
  filters: ExpenseFilters;
  options: FilterOptions;
  onChange: (patch: ExpenseFilters) => void;
  /** Show custom date inputs when no When preset is active. */
  showCustomDates?: boolean;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted font-medium">{label}</span>
      {children}
    </label>
  );
}

const fieldClass = `${ui.select} py-1.5 text-sm`;

export function ExpenseFiltersPanel({
  filters,
  options,
  onChange,
  showCustomDates = true,
}: Props) {
  return (
    <div className="space-y-3">
      {showCustomDates ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            value={filters.dateFrom?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onChange({
                dateFrom: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
            className={`${ui.input} max-w-[9.5rem] py-1.5 text-sm`}
            aria-label="From date"
          />
          <span className="text-muted text-xs">–</span>
          <input
            type="date"
            value={filters.dateTo?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onChange({
                dateTo: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
            className={`${ui.input} max-w-[9.5rem] py-1.5 text-sm`}
            aria-label="To date"
          />
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Friend">
          <select
            value={filters.friendId ?? ""}
            onChange={(e) =>
              onChange({
                friendId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={fieldClass}
          >
            <option value="">Any</option>
            {options.friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Group">
          <select
            value={filters.groupId ?? ""}
            onChange={(e) =>
              onChange({
                groupId: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            className={fieldClass}
          >
            <option value="">All</option>
            {options.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select
            value={filters.categoryId ?? ""}
            onChange={(e) =>
              onChange({
                categoryId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={fieldClass}
          >
            <option value="">All</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Currency">
          <select
            value={filters.currency ?? ""}
            onChange={(e) =>
              onChange({ currency: e.target.value || undefined })
            }
            className={fieldClass}
          >
            <option value="">All</option>
            {options.currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Share min">
          <input
            type="number"
            step="0.01"
            value={filters.shareMin ?? ""}
            onChange={(e) =>
              onChange({
                shareMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={`${ui.input} py-1.5 text-sm`}
          />
        </Field>
        <Field label="Share max">
          <input
            type="number"
            step="0.01"
            value={filters.shareMax ?? ""}
            onChange={(e) =>
              onChange({
                shareMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={`${ui.input} py-1.5 text-sm`}
          />
        </Field>
        <Field label="Total min">
          <input
            type="number"
            step="0.01"
            value={filters.costMin ?? ""}
            onChange={(e) =>
              onChange({
                costMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={`${ui.input} py-1.5 text-sm`}
          />
        </Field>
        <Field label="Total max">
          <input
            type="number"
            step="0.01"
            value={filters.costMax ?? ""}
            onChange={(e) =>
              onChange({
                costMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className={`${ui.input} py-1.5 text-sm`}
          />
        </Field>
      </div>
    </div>
  );
}
