/**
 * Theme-aware class bundles — pair with semantic CSS tokens in globals.css.
 * Prefer these over raw stone/white Tailwind utilities.
 */
export const ui = {
  btnSecondary:
    "border-border bg-card text-foreground inline-flex items-center justify-center rounded-lg border font-medium hover:bg-hover disabled:opacity-50",
  btnGhost:
    "text-muted hover:text-foreground hover:bg-hover inline-flex items-center justify-center rounded-md",
  input:
    "border-border bg-input text-foreground focus:border-accent focus:ring-accent/20 w-full rounded-lg border outline-none focus:ring-2",
  dateInput:
    "border-border bg-input text-foreground focus:border-accent focus:ring-accent/20 h-7 w-[8.5rem] max-w-full shrink-0 rounded-md border px-2.5 py-1 text-xs font-normal outline-none focus:ring-2 focus:ring-accent/20 [color-scheme:light] dark:[color-scheme:dark]",
  filterSelect:
    "border-border bg-input text-foreground focus:border-accent focus:ring-accent/20 w-[10.5rem] max-w-full shrink-0 rounded-md border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-accent/20",
  filterNumber:
    "border-border bg-input text-foreground focus:border-accent focus:ring-accent/20 w-[4.75rem] max-w-full shrink-0 rounded-md border px-2 py-1 text-xs tabular-nums outline-none focus:ring-2 focus:ring-accent/20",
  select:
    "border-border bg-input text-foreground rounded border px-2 py-1 text-xs",
  pill: "border-border bg-card hover:bg-hover shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium",
  pillMd:
    "border-border bg-card hover:bg-hover shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium",
  pillActive:
    "bg-pill-active text-pill-active-fg shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
  pillActiveMd:
    "bg-pill-active text-pill-active-fg shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium",
  chip: "border-border bg-muted-surface hover:bg-hover rounded px-1.5 py-0.5",
  surfaceMuted: "bg-muted-surface",
  tableRowHover: "hover:bg-hover",
  listRow:
    "border-border hover:bg-hover active:bg-active border-b text-left transition-colors",
  monthHeader:
    "border-border bg-header-subtle text-muted sticky top-0 z-10 border-b px-4 py-2 text-xs font-semibold tracking-widest",
  errorBox:
    "border-error-border bg-error-bg text-error-text rounded-md border px-2 py-1 text-xs",
  errorBoxLg:
    "border-error-border bg-error-bg text-error-text rounded-lg border px-3 py-2 text-sm",
  warnBanner:
    "border-warn-border bg-warn-bg text-warn-text border-b px-4 py-2 text-xs sm:text-sm",
  successBox:
    "border-success-border bg-success-bg text-success-text rounded-lg border px-4 py-3 text-sm",
  progressTrack: "bg-muted-surface h-1 overflow-hidden rounded-full",
  avatar:
    "bg-muted-surface text-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
  panelFooter: "border-border bg-muted-surface/60 border-t px-4 py-3",
  cardGradient:
    "border-border bg-card from-gradient-from to-gradient-to overflow-hidden rounded-2xl border bg-gradient-to-b shadow-sm",
  tabRail: "border-border bg-muted-surface flex gap-1 rounded-lg border p-1",
  overlay: "bg-overlay fixed inset-0 backdrop-blur-[1px]",
  listBordered:
    "divide-border border-border divide-y overflow-hidden rounded-lg border",
  listFlush: "divide-border divide-y",
  interactiveRow:
    "hover:bg-hover focus-visible:ring-accent flex items-center gap-3 px-3 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none sm:px-4",
  segmentTabRail:
    "border-border flex items-center justify-between gap-3 border-b",
  segmentTabActive:
    "text-foreground border-accent -mb-px border-b-2 pb-2.5 text-sm font-semibold",
  segmentTabInactive:
    "text-muted hover:text-foreground pb-2.5 text-sm font-medium",
  seeAllLink: "text-accent shrink-0 pb-2.5 text-xs font-medium hover:underline",
  emptyDashed:
    "text-muted rounded-lg border border-dashed p-6 text-center text-sm",
  emptyPlain: "text-muted text-center text-sm",
  summaryCard: "rounded-lg border p-4 md:p-5",
  listSectionHeader:
    "border-border bg-muted-surface/60 border-b px-3 py-2 sm:px-4",
} as const;

/** Active/inactive pill button classes — use with FilterPills or standalone toggles. */
export function pillClass(active: boolean, size: "sm" | "md" = "md"): string {
  if (active) return size === "sm" ? ui.pillActive : ui.pillActiveMd;
  return size === "sm" ? ui.pill : ui.pillMd;
}
