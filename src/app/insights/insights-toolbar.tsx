export type DatePreset =
  | "all"
  | "thisMonth"
  | "last30"
  | "thisYear"
  | "lastYear";

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

const PRESET_LABELS: Record<DatePreset, string> = {
  all: "All time",
  thisMonth: "This month",
  last30: "Last 30 days",
  thisYear: "This year",
  lastYear: "Last year",
};

export function insightsPeriodLabel(
  from: string,
  to: string,
  activePreset: DatePreset | null,
): string {
  if (activePreset) return PRESET_LABELS[activePreset];
  if (!from && !to) return "All time";
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Through ${to}`;
  return "Custom range";
}
