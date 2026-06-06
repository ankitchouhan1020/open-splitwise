"use client";

import { ExpenseFiltersPanel } from "@/app/explore/expense-filters-panel";
import { ExploreGroupPills } from "@/app/explore/explore-group-pills";
import { ExploreSavedViews } from "@/app/explore/explore-saved-views";
import {
  datePresetRange,
  detectDatePreset,
  detectActivityPreset,
  activityPresetPatch,
  countRefineFilters,
} from "@/app/explore/explore-toolbar";
import { FilterPillButton, FilterPills } from "@/components/ui/filter-pills";
import { ui } from "@/lib/ui-classes";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import type { ExploreGroupStat } from "@/lib/expenses/explore-context";
import type { RefObject } from "react";

type ActivityPreset = "all" | "expenses" | "settlements";
type DatePreset = "all" | "thisMonth" | "last30" | "thisYear";

const ACTIVITY_PRESETS: { id: ActivityPreset; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expenses", label: "Expenses" },
  { id: "settlements", label: "Settlements" },
];

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "thisMonth", label: "This month" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisYear", label: "This year" },
];

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
  onApplySavedView: (filters: ExpenseFilters) => void;
  onClearAll: () => void;
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
  onApplySavedView,
  onClearAll,
  groupStats,
  options,
}: Props) {
  const activeDatePreset = detectDatePreset(filters);
  const activeActivity = detectActivityPreset(filters);
  const refineCount = countRefineFilters(filters, groupStats);

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-2 p-2.5 sm:p-3">
        <div className="relative min-w-0">
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
            placeholder="Search"
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

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
          <FilterPills
            items={ACTIVITY_PRESETS}
            activeId={activeActivity}
            onChange={(id) => onChange(activityPresetPatch(id))}
            ariaLabel="Activity type"
            as="group"
            size="sm"
            className="shrink-0"
          />
          <div
            className="flex min-w-0 flex-1 flex-wrap gap-1.5"
            role="group"
            aria-label="Date range"
          >
            {DATE_PRESETS.map((p) => {
              const isActive =
                p.id === "all"
                  ? !filters.dateFrom && !filters.dateTo
                  : activeDatePreset === p.id;
              return (
                <FilterPillButton
                  key={p.id}
                  active={isActive}
                  onClick={() =>
                    onChange({ ...datePresetRange(p.id), page: 1 })
                  }
                  size="sm"
                >
                  {p.label}
                </FilterPillButton>
              );
            })}
          </div>
        </div>

        {groupStats.length > 0 ? (
          <ExploreGroupPills
            groups={groupStats}
            activeGroupId={filters.groupId}
            onSelectGroup={(id) => onChange({ groupId: id, page: 1 })}
            size="sm"
          />
        ) : null}
      </div>

      <ExploreSavedViews
        currentFilters={filters}
        onApply={onApplySavedView}
        onClear={onClearAll}
      />

      {refineOpen ? (
        <div className="border-border border-t px-2.5 py-2">
          <ExpenseFiltersPanel
            filters={filters}
            options={options}
            onChange={onChange}
            showCustomDates={activeDatePreset === "all"}
          />
        </div>
      ) : null}

      <div className="border-border flex items-center justify-between gap-2 border-t px-2.5 py-1.5">
        <button
          type="button"
          onClick={onToggleRefine}
          aria-expanded={refineOpen}
          className={
            refineOpen || refineCount > 0
              ? "border-accent text-accent rounded-md border px-2 py-1 text-xs font-medium"
              : "border-border hover:bg-hover rounded-md border px-2 py-1 text-xs font-medium"
          }
        >
          {refineOpen ? "Hide" : "Refine"}
          {!refineOpen && refineCount > 0 ? (
            <span className="bg-accent text-accent-foreground ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {refineCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onExport}
          className="text-muted hover:text-foreground px-1 py-1 text-xs font-medium"
        >
          Export
        </button>
      </div>
    </div>
  );
}
