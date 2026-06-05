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
    <div className="border-border bg-card space-y-3 rounded-lg border px-3 py-3">
      <div className="-mx-1 flex scrollbar-none items-center gap-1 overflow-x-auto px-1 pb-0.5 md:flex-wrap md:overflow-visible">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(p.id)}
            className={
              activePreset === p.id
                ? "bg-pill-active text-pill-active-fg shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium"
                : "border-border hover:bg-hover shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium"
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => {
            onFromChange(e.target.value);
            onClearPreset();
          }}
          className="border-border min-h-9 flex-1 rounded-md border px-2 py-1.5 text-xs sm:flex-none"
        />
        <span className="text-muted text-xs">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            onToChange(e.target.value);
            onClearPreset();
          }}
          className="border-border min-h-9 flex-1 rounded-md border px-2 py-1.5 text-xs sm:flex-none"
        />
        <select
          value={groupId}
          onChange={(e) => onGroupChange(e.target.value)}
          className="border-border min-h-9 w-full rounded-md border px-2 py-1.5 text-xs sm:w-auto sm:max-w-[130px]"
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
          className="border-border min-h-9 w-full rounded-md border px-2 py-1.5 text-xs sm:w-auto"
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
