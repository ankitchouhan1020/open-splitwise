"use client";

import type { ExpenseFilters } from "@/lib/expenses/filters";

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
};

export function ExpenseFiltersPanel({ filters, options, onChange }: Props) {
  return (
    <div className="border-border bg-card grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-medium">From</span>
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
          className="border-border rounded-md border px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-medium">To</span>
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
          className="border-border rounded-md border px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-medium">Group</span>
        <select
          value={filters.groupId ?? ""}
          onChange={(e) =>
            onChange({
              groupId: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="border-border rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">All groups</option>
          {options.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-medium">Friend</span>
        <select
          value={filters.friendId ?? ""}
          onChange={(e) =>
            onChange({
              friendId: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="border-border rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">Any</option>
          {options.friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-medium">Category</span>
        <select
          value={filters.categoryId ?? ""}
          onChange={(e) =>
            onChange({
              categoryId: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="border-border rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-medium">Currency</span>
        <select
          value={filters.currency ?? ""}
          onChange={(e) => onChange({ currency: e.target.value || undefined })}
          className="border-border rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          {options.currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-medium">Type</span>
        <select
          value={
            filters.payment === true
              ? "payment"
              : filters.payment === false
                ? "expense"
                : ""
          }
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              payment:
                v === "payment" ? true : v === "expense" ? false : undefined,
            });
          }}
          className="border-border rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="expense">Expenses only</option>
          <option value="payment">Payments only</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">Total min</span>
          <input
            type="number"
            step="0.01"
            value={filters.costMin ?? ""}
            onChange={(e) =>
              onChange({
                costMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">Total max</span>
          <input
            type="number"
            step="0.01"
            value={filters.costMax ?? ""}
            onChange={(e) =>
              onChange({
                costMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">My share min</span>
          <input
            type="number"
            step="0.01"
            value={filters.shareMin ?? ""}
            onChange={(e) =>
              onChange({
                shareMin: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">My share max</span>
          <input
            type="number"
            step="0.01"
            value={filters.shareMax ?? ""}
            onChange={(e) =>
              onChange({
                shareMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
