"use client";

type DatePreset = "all" | "thisMonth" | "last30" | "thisYear" | "lastYear";

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All" },
  { id: "thisMonth", label: "Month" },
  { id: "last30", label: "30d" },
  { id: "thisYear", label: "Year" },
  { id: "lastYear", label: "Last year" },
];

export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function defaultDateRange(): { from: string; to: string } {
  return { from: "", to: "" };
}

export function presetRange(preset: DatePreset): { from: string; to: string } {
  if (preset === "all") return { from: "", to: "" };
  const now = new Date();
  switch (preset) {
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toDateInput(from), to: toDateInput(now) };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: toDateInput(from), to: toDateInput(now) };
    }
    case "thisYear": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: toDateInput(from), to: toDateInput(now) };
    }
    case "lastYear": {
      const from = new Date(now.getFullYear() - 1, 0, 1);
      const to = new Date(now.getFullYear() - 1, 11, 31);
      return { from: toDateInput(from), to: toDateInput(to) };
    }
  }
}

type Props = {
  from: string;
  to: string;
  groupId: string;
  currency: string;
  activePreset: DatePreset | null;
  groups: Array<{ id: number; name: string }>;
  currencies: string[];
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onGroupChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  onPreset: (preset: DatePreset) => void;
  onClearPreset: () => void;
};

export function InsightsToolbar({
  from,
  to,
  groupId,
  currency,
  activePreset,
  groups,
  currencies,
  onFromChange,
  onToChange,
  onGroupChange,
  onCurrencyChange,
  onPreset,
  onClearPreset,
}: Props) {
  return (
    <div className="border-border bg-card space-y-2 rounded-lg border px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(p.id)}
            className={
              activePreset === p.id
                ? "rounded-md bg-stone-800 px-2.5 py-1 text-xs font-medium text-white"
                : "border-border rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-stone-50"
            }
          >
            {p.label}
          </button>
        ))}
        <span className="text-border hidden h-4 w-px bg-stone-200 sm:block" />
        <input
          type="date"
          value={from}
          onChange={(e) => {
            onFromChange(e.target.value);
            onClearPreset();
          }}
          className="border-border rounded-md border px-2 py-1 text-xs"
        />
        <span className="text-muted text-xs">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            onToChange(e.target.value);
            onClearPreset();
          }}
          className="border-border rounded-md border px-2 py-1 text-xs"
        />
        <select
          value={groupId}
          onChange={(e) => onGroupChange(e.target.value)}
          className="border-border max-w-[130px] rounded-md border px-2 py-1 text-xs"
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="border-border rounded-md border px-2 py-1 text-xs"
        >
          <option value="">All currencies</option>
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export type { DatePreset };
