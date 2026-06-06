"use client";

import { ui } from "@/lib/ui-classes";

type Chip = { key: string; label: string };

type Props = {
  count: number;
  amountLabel: string;
  amounts: string;
  pending?: boolean;
  sort: string;
  order: string;
  onSortChange: (sort: string, order: string) => void;
  chips: Chip[];
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
  loadingMore?: boolean;
  hidden?: boolean;
};

export function ExploreSummaryBar({
  count,
  amountLabel,
  amounts,
  pending = false,
  sort,
  order,
  onSortChange,
  chips,
  onClearFilter,
  onClearAll,
  loadingMore = false,
  hidden = false,
}: Props) {
  if (hidden) return null;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="text-foreground font-medium tabular-nums">
            {count.toLocaleString()} expenses
          </span>
          <span className="text-muted font-normal">
            · {amountLabel} {amounts}
          </span>
          {pending ? (
            <span className="text-muted font-normal">· updating…</span>
          ) : null}
        </div>

        <label className="text-muted flex shrink-0 items-center gap-1.5 text-xs font-normal">
          Sort
          <select
            value={`${sort}:${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split(":");
              onSortChange(s, o);
            }}
            className={ui.select}
          >
            <option value="date:desc">Newest</option>
            <option value="date:asc">Oldest</option>
            <option value="cost:desc">Highest share</option>
            <option value="cost:asc">Lowest share</option>
            <option value="description:asc">A → Z</option>
            <option value="description:desc">Z → A</option>
          </select>
        </label>
      </div>

      {(chips.length > 0 || loadingMore) && (
        <div className="border-border mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onClearFilter(chip.key)}
              className={`${ui.chip} text-xs`}
            >
              {chip.label} ×
            </button>
          ))}
          {chips.length > 0 ? (
            <button
              type="button"
              onClick={onClearAll}
              className="text-accent text-xs font-medium hover:underline"
            >
              Clear all
            </button>
          ) : null}
          {loadingMore ? (
            <span className="text-muted text-xs">Loading more…</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
