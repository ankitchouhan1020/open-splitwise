"use client";

import type { ExpenseFilters } from "@/lib/expenses/filters";
import { useCallback, useEffect, useState } from "react";

type SavedView = { id: number; name: string; filters: ExpenseFilters };

type Props = {
  currentFilters: ExpenseFilters;
  onApply: (filters: ExpenseFilters) => void;
};

export function SavedViewsPanel({ currentFilters, onApply }: Props) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/saved-views");
    if (res.ok) {
      const data = (await res.json()) as { views: SavedView[] };
      setViews(data.views);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveView() {
    setError(null);
    const res = await fetch("/api/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters: currentFilters }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Save failed");
      return;
    }
    setName("");
    void load();
  }

  async function removeView(id: number) {
    await fetch(`/api/saved-views/${id}`, { method: "DELETE" });
    void load();
  }

  async function renameView(id: number, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await fetch(`/api/saved-views/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    void load();
  }

  return (
    <aside className="border-border bg-card w-full shrink-0 rounded-xl border p-4 lg:w-56">
      <h3 className="text-sm font-semibold">Saved views</h3>
      <p className="text-muted mt-1 text-xs">Up to 20 named filter presets.</p>
      <ul className="mt-3 space-y-1">
        {views.map((v) => (
          <li key={v.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onApply(v.filters)}
              className="text-accent flex-1 truncate text-left text-sm hover:underline"
            >
              {v.name}
            </button>
            <button
              type="button"
              title="Rename"
              className="text-muted hover:text-foreground text-xs"
              onClick={() => {
                const next = prompt("Rename view", v.name);
                if (next) void renameView(v.id, next);
              }}
            >
              ✎
            </button>
            <button
              type="button"
              title="Delete"
              className="text-muted text-xs hover:text-red-600"
              onClick={() => void removeView(v.id)}
            >
              ×
            </button>
          </li>
        ))}
        {views.length === 0 && (
          <li className="text-muted text-xs">No saved views yet.</li>
        )}
      </ul>
      <div className="mt-3 flex gap-1">
        <input
          type="text"
          placeholder="View name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-border min-w-0 flex-1 rounded-md border px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={() => void saveView()}
          className="bg-accent rounded-md px-2 py-1 text-xs font-medium text-white"
        >
          Save
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </aside>
  );
}
