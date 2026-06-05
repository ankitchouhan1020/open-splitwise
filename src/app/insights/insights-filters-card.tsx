"use client";

import type { DatePreset } from "@/app/insights/insights-toolbar";
import { FilterPills } from "@/components/ui/filter-pills";
import { ui } from "@/lib/ui-classes";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "thisMonth", label: "This month" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisYear", label: "This year" },
  { id: "lastYear", label: "Last year" },
];

type Props = {
  from: string;
  to: string;
  groupId: string;
  activePreset: DatePreset | null;
  groups: Array<{ id: number; name: string }>;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onGroupChange: (v: string) => void;
  onPreset: (preset: DatePreset) => void;
  onClearPreset: () => void;
};

const dateInputClass = `${ui.input} max-w-[9.5rem] py-1.5 text-sm`;
const groupSelectClass = `${ui.select} w-full shrink-0 py-1.5 text-sm sm:w-auto sm:max-w-[10rem]`;

export function InsightsFiltersCard({
  from,
  to,
  groupId,
  activePreset,
  groups,
  onFromChange,
  onToChange,
  onGroupChange,
  onPreset,
  onClearPreset,
}: Props) {
  const showCustomRange = activePreset === null && (from || to);

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-2 p-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <FilterPills
            items={DATE_PRESETS}
            activeId={activePreset ?? "all"}
            onChange={onPreset}
            ariaLabel="Date range"
            as="group"
            size="md"
            className="min-w-0 flex-1"
          />
          <select
            value={groupId}
            onChange={(e) => onGroupChange(e.target.value)}
            className={groupSelectClass}
            aria-label="Group"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {showCustomRange ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                onFromChange(e.target.value);
                onClearPreset();
              }}
              className={dateInputClass}
              aria-label="From date"
            />
            <span className="text-muted text-xs">–</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                onToChange(e.target.value);
                onClearPreset();
              }}
              className={dateInputClass}
              aria-label="To date"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
