"use client";

import type { ExpenseFilters } from "@/lib/expenses/filters";

type DatePreset = "all" | "thisMonth" | "last30" | "thisYear";

type ActivityPreset = "all" | "expenses" | "settlements";

const ACTIVITY_PRESETS: { id: ActivityPreset; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expenses", label: "Expenses" },
  { id: "settlements", label: "Settlements" },
];

function detectActivityPreset(filters: ExpenseFilters): ActivityPreset {
  if (filters.payment === true) return "settlements";
  if (filters.payment === false) return "expenses";
  return "all";
}

function activityPresetPatch(
  preset: ActivityPreset,
): Pick<ExpenseFilters, "payment"> {
  if (preset === "settlements") return { payment: true };
  if (preset === "expenses") return { payment: false };
  return { payment: undefined };
}

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "thisMonth", label: "This month" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisYear", label: "This year" },
];

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function datePresetRange(preset: DatePreset): {
  dateFrom?: string;
  dateTo?: string;
} {
  if (preset === "all") return { dateFrom: undefined, dateTo: undefined };
  const now = new Date();
  switch (preset) {
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
    case "thisYear": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { dateFrom: from.toISOString(), dateTo: now.toISOString() };
    }
  }
}

function detectPreset(filters: ExpenseFilters): DatePreset {
  if (!filters.dateFrom && !filters.dateTo) return "all";
  const from = filters.dateFrom?.slice(0, 10);
  const to = filters.dateTo?.slice(0, 10);
  const now = new Date();
  for (const p of PRESETS) {
    if (p.id === "all") continue;
    const range = datePresetRange(p.id);
    if (
      range.dateFrom?.slice(0, 10) === from &&
      range.dateTo?.slice(0, 10) === to
    ) {
      return p.id;
    }
  }
  if (from === toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))) {
    return "thisMonth";
  }
  return "all";
}

function countExtraFilters(
  filters: ExpenseFilters,
  visibleGroupIds?: number[],
): number {
  let n = 0;
  if (filters.friendId !== undefined) n++;
  if (filters.categoryId !== undefined) n++;
  if (filters.currency) n++;
  if (filters.payment !== undefined) n++;
  if (filters.costMin != null || filters.costMax != null) n++;
  if (filters.shareMin != null || filters.shareMax != null) n++;
  const preset = detectPreset(filters);
  if ((filters.dateFrom || filters.dateTo) && preset === "all") {
    n++;
  }
  if (filters.groupId !== undefined) {
    const inPills = visibleGroupIds?.includes(filters.groupId) ?? false;
    if (!inPills) n++;
  }
  return n;
}

type Props = {
  filters: ExpenseFilters;
  searchInput: string;
  onSearchChange: (q: string) => void;
  searchPending?: boolean;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onChange: (patch: ExpenseFilters) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onExport: () => void;
  visibleGroupIds?: number[];
};

export function ExploreToolbar({
  filters,
  searchInput,
  onSearchChange,
  searchPending = false,
  searchRef,
  onChange,
  filtersOpen,
  onToggleFilters,
  onExport,
  visibleGroupIds,
}: Props) {
  const activePreset = detectPreset(filters);
  const activeActivity = detectActivityPreset(filters);
  const extraFilterCount = countExtraFilters(filters, visibleGroupIds);

  return (
    <div className="space-y-3 p-3 md:space-y-3">
      <div className="relative">
        <svg
          aria-hidden
          className="text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        <input
          ref={searchRef}
          type="search"
          placeholder="Search descriptions and notes"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border focus:border-accent focus:ring-accent/20 w-full rounded-lg border py-2.5 pr-10 pl-9 text-base outline-none focus:ring-2 md:text-sm"
          aria-busy={searchPending}
        />
        {searchInput.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="text-muted hover:text-foreground hover:bg-hover absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div
        className="-mx-1 flex scrollbar-none items-center gap-1 overflow-x-auto px-1 pb-0.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        role="group"
        aria-label="Activity type"
      >
        {ACTIVITY_PRESETS.map((p) => {
          const isActive = activeActivity === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(activityPresetPatch(p.id))}
              className={
                isActive
                  ? "bg-accent text-accent-foreground shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium md:py-1"
                  : "border-border hover:bg-hover shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium md:py-1"
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div
          className="-mx-1 flex scrollbar-none items-center gap-1 overflow-x-auto px-1 pb-0.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0"
          role="group"
          aria-label="Date range"
        >
          {PRESETS.map((p) => {
            const isActive =
              p.id === "all"
                ? !filters.dateFrom && !filters.dateTo
                : activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(datePresetRange(p.id))}
                className={
                  isActive
                    ? "bg-pill-active text-pill-active-fg shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium md:py-1"
                    : "border-border hover:bg-hover shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium md:py-1"
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <button
            type="button"
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
            className={
              filtersOpen || extraFilterCount > 0
                ? "border-accent text-accent flex-1 rounded-md border px-2.5 py-1.5 text-xs font-medium md:flex-none md:py-1"
                : "border-border hover:bg-hover flex-1 rounded-md border px-2.5 py-1.5 text-xs font-medium md:flex-none md:py-1"
            }
          >
            {filtersOpen ? "Hide filters" : "Filters"}
            {!filtersOpen && extraFilterCount > 0 && (
              <span className="bg-accent text-accent-foreground ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                {extraFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="text-muted hover:text-foreground hidden shrink-0 px-1 py-1.5 text-xs font-medium sm:inline"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export { detectPreset as detectDatePreset };
