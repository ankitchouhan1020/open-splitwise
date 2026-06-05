"use client";

import { FilterPillButton } from "@/components/ui/filter-pills";
import type { ExpenseFilters } from "@/lib/expenses/filters";
import { useCallback, useEffect, useState } from "react";

type SavedView = { id: number; name: string; filters: ExpenseFilters };

type Props = {
  currentFilters: ExpenseFilters;
  onApply: (filters: ExpenseFilters) => void;
  onClear: () => void;
};

export function ExploreSavedViews({ currentFilters, onApply, onClear }: Props) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [groupLabels, setGroupLabels] = useState<Map<number, string>>(
    new Map(),
  );

  const load = useCallback(async () => {
    const [viewsRes, optsRes] = await Promise.all([
      fetch("/api/saved-views"),
      fetch("/api/filters/options"),
    ]);
    if (viewsRes.ok) {
      const data = (await viewsRes.json()) as { views: SavedView[] };
      setViews(data.views);
    }
    if (optsRes.ok) {
      const opts = (await optsRes.json()) as {
        groups: Array<{ id: number; name: string }>;
      };
      setGroupLabels(new Map(opts.groups.map((g) => [g.id, g.name])));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasActiveFilters =
    !!currentFilters.q ||
    !!currentFilters.dateFrom ||
    !!currentFilters.dateTo ||
    !!currentFilters.groupId ||
    !!currentFilters.friendId ||
    !!currentFilters.categoryId ||
    !!currentFilters.currency ||
    currentFilters.payment !== undefined ||
    currentFilters.costMin != null ||
    currentFilters.costMax != null;

  async function saveView() {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    setSaving(true);
    const res = await fetch("/api/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, filters: currentFilters }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveName("");
      setShowSave(false);
      void load();
    }
  }

  function suggestSaveName(): string {
    if (currentFilters.groupId) {
      return groupLabels.get(currentFilters.groupId) ?? "My view";
    }
    return "My view";
  }

  if (views.length === 0 && !hasActiveFilters && !showSave) {
    return null;
  }

  return (
    <div className="border-border flex flex-wrap items-center gap-1 border-t px-2.5 py-1.5">
      <FilterPillButton active={!hasActiveFilters} onClick={onClear} size="sm">
        All
      </FilterPillButton>
      {views.map((v) => {
        const isActive =
          JSON.stringify(v.filters) === JSON.stringify(currentFilters);
        return (
          <FilterPillButton
            key={v.id}
            active={isActive}
            onClick={() => onApply(v.filters)}
            size="sm"
          >
            {v.name}
          </FilterPillButton>
        );
      })}
      {hasActiveFilters && !showSave && (
        <button
          type="button"
          onClick={() => {
            setSaveName(suggestSaveName());
            setShowSave(true);
          }}
          className="text-accent shrink-0 px-1 text-xs font-medium hover:underline"
        >
          + Save view
        </button>
      )}
      {showSave && (
        <>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="border-border w-28 rounded-md border px-2 py-1 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") void saveView();
              if (e.key === "Escape") setShowSave(false);
            }}
          />
          <button
            type="button"
            disabled={saving || !saveName.trim()}
            onClick={() => void saveView()}
            className="bg-accent text-accent-foreground rounded-md px-2 py-1 text-xs disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowSave(false)}
            className="text-muted text-xs"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}
