"use client";

import { ExploreFilterRow } from "@/app/explore/explore-filter-row";
import { ExpenseFiltersPanel } from "@/app/explore/expense-filters-panel";
import { ExploreGroupPills } from "@/app/explore/explore-group-pills";
import {
  datePresetRange,
  detectDatePreset,
  detectActivityPreset,
  activityPresetPatch,
  countRefineFilters,
  EXPLORE_ACTIVITY_PRESETS,
  EXPLORE_DATE_PRESETS,
} from "@/app/explore/explore-toolbar";
import { FilterPills } from "@/components/ui/filter-pills";
import { ExpenseDateRangeInputs } from "@/components/ui/date-range-inputs";
import { ui } from "@/lib/ui-classes";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import type { ExploreGroupStat } from "@/lib/expenses/explore-context";
import type { RefObject } from "react";

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
  searchInput: string;
  onSearchChange: (q: string) => void;
  searchPending?: boolean;
  searchRef?: RefObject<HTMLInputElement | null>;
  onChange: (patch: ExpenseFilters) => void;
  refineOpen: boolean;
  onToggleRefine: () => void;
  onExport: () => void;
  groupStats: ExploreGroupStat[];
  options: FilterOptions;
};

export function ExploreFiltersCard({
  filters,
  searchInput,
  onSearchChange,
  searchPending = false,
  searchRef,
  onChange,
  refineOpen,
  onToggleRefine,
  onExport,
  groupStats,
  options,
}: Props) {
  const activeDatePreset = detectDatePreset(filters);
  const activeActivity = detectActivityPreset(filters);
  const refineCount = countRefineFilters(filters, groupStats);
  const showCustomDates = activeDatePreset === "all";

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="border-border flex flex-col gap-2 border-b px-2.5 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-3">
        <div className="relative min-w-0 flex-1">
          <svg
            aria-hidden
            className="text-muted pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
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
            ref={searchRef ?? undefined}
            type="search"
            placeholder="Search expenses"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`${ui.input} py-2 pr-9 pl-8 text-sm`}
            aria-busy={searchPending}
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-muted hover:text-foreground hover:bg-hover absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleRefine}
            aria-expanded={refineOpen}
            className={
              refineOpen || refineCount > 0
                ? "border-accent text-accent rounded-md border px-2.5 py-1.5 text-xs font-medium"
                : `${ui.btnSecondary} px-2.5 py-1.5 text-xs`
            }
          >
            {refineOpen ? "Hide filters" : "More filters"}
            {!refineOpen && refineCount > 0 ? (
              <span className="bg-accent text-accent-foreground ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                {refineCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="text-muted hover:text-foreground px-1 py-1.5 text-xs font-medium"
          >
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-2.5 sm:p-3">
        <ExploreFilterRow label="Type">
          <FilterPills
            items={EXPLORE_ACTIVITY_PRESETS}
            activeId={activeActivity}
            onChange={(id) => onChange(activityPresetPatch(id))}
            ariaLabel="Activity type"
            as="group"
            size="sm"
          />
        </ExploreFilterRow>

        <ExploreFilterRow label="When">
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterPills
              items={EXPLORE_DATE_PRESETS}
              activeId={activeDatePreset}
              onChange={(id) => onChange({ ...datePresetRange(id), page: 1 })}
              ariaLabel="Date range"
              as="group"
              size="sm"
            />
            {showCustomDates ? (
              <ExpenseDateRangeInputs
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onChange={onChange}
              />
            ) : null}
          </div>
        </ExploreFilterRow>

        {groupStats.length > 0 ? (
          <ExploreFilterRow label="Group">
            <ExploreGroupPills
              groups={groupStats}
              activeGroupId={filters.groupId}
              onSelectGroup={(id) => onChange({ groupId: id, page: 1 })}
              size="sm"
            />
          </ExploreFilterRow>
        ) : null}
      </div>

      {refineOpen ? (
        <div className="border-border bg-muted-surface/30 border-t px-2.5 py-2.5 sm:px-3">
          <ExpenseFiltersPanel
            filters={filters}
            options={options}
            onChange={onChange}
          />
        </div>
      ) : null}
    </div>
  );
}
