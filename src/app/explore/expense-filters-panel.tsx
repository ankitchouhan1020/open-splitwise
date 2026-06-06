"use client";

import { ExploreFilterRow } from "@/app/explore/explore-filter-row";
import type { ReactNode } from "react";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import { ui } from "@/lib/ui-classes";

type FilterOptions = {
  ownerUserId: number;
  ownerName: string;
  groups: Array<{ id: number; name: string }>;
  friends: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  currencies: string[];
};

type Props = {
  filters: ExpenseFilters;
  options: FilterOptions;
  onChange: (patch: ExpenseFilters) => void;
};

function InlineSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-muted shrink-0 font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ui.filterSelect}
      >
        {children}
      </select>
    </label>
  );
}

function AmountRange({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minValue?: number;
  maxValue?: number;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted shrink-0 font-medium">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Min"
        value={minValue ?? ""}
        onChange={(e) =>
          onMinChange(e.target.value ? Number(e.target.value) : undefined)
        }
        className={ui.filterNumber}
        aria-label={`${label} minimum`}
      />
      <span className="text-muted shrink-0">–</span>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Max"
        value={maxValue ?? ""}
        onChange={(e) =>
          onMaxChange(e.target.value ? Number(e.target.value) : undefined)
        }
        className={ui.filterNumber}
        aria-label={`${label} maximum`}
      />
    </div>
  );
}

export function ExpenseFiltersPanel({ filters, options, onChange }: Props) {
  const patch = (next: ExpenseFilters) => onChange({ ...next, page: 1 });

  return (
    <div className="flex flex-col gap-2.5">
      <ExploreFilterRow label="People">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <InlineSelect
            label="Paid by"
            value={filters.paidByUserId ?? ""}
            onChange={(value) =>
              patch({
                paidByUserId: value ? Number(value) : undefined,
              })
            }
          >
            <option value="">Any</option>
            <option value={options.ownerUserId}>
              {options.ownerName} (you)
            </option>
            {options.friends.map((f) => (
              <option key={`paid-by-${f.id}`} value={f.id}>
                {f.name}
              </option>
            ))}
          </InlineSelect>
          <InlineSelect
            label="Paid to"
            value={filters.paidToUserId ?? ""}
            onChange={(value) =>
              patch({
                paidToUserId: value ? Number(value) : undefined,
              })
            }
          >
            <option value="">Any</option>
            <option value={options.ownerUserId}>
              {options.ownerName} (you)
            </option>
            {options.friends.map((f) => (
              <option key={`paid-to-${f.id}`} value={f.id}>
                {f.name}
              </option>
            ))}
          </InlineSelect>
          <InlineSelect
            label="Friend"
            value={filters.friendId ?? ""}
            onChange={(value) =>
              patch({
                friendId: value ? Number(value) : undefined,
              })
            }
          >
            <option value="">Any</option>
            {options.friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </InlineSelect>
        </div>
      </ExploreFilterRow>

      <ExploreFilterRow label="Details">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <InlineSelect
            label="Group"
            value={filters.groupId ?? ""}
            onChange={(value) =>
              patch({
                groupId: value ? Number(value) : undefined,
              })
            }
          >
            <option value="">All</option>
            {options.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </InlineSelect>
          <InlineSelect
            label="Category"
            value={filters.categoryId ?? ""}
            onChange={(value) =>
              patch({
                categoryId: value ? Number(value) : undefined,
              })
            }
          >
            <option value="">All</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </InlineSelect>
          <InlineSelect
            label="Currency"
            value={filters.currency ?? ""}
            onChange={(value) => patch({ currency: value || undefined })}
          >
            <option value="">All</option>
            {options.currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </InlineSelect>
        </div>
      </ExploreFilterRow>

      <ExploreFilterRow label="Amount">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <AmountRange
            label="Share"
            minValue={filters.shareMin}
            maxValue={filters.shareMax}
            onMinChange={(shareMin) => patch({ shareMin })}
            onMaxChange={(shareMax) => patch({ shareMax })}
          />
          <AmountRange
            label="Total"
            minValue={filters.costMin}
            maxValue={filters.costMax}
            onMinChange={(costMin) => patch({ costMin })}
            onMaxChange={(costMax) => patch({ costMax })}
          />
        </div>
      </ExploreFilterRow>
    </div>
  );
}
