/** Read chart colors from CSS variables (works in light + dark). */
export function chartThemeFromDocument(): {
  accent: string;
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
} {
  if (typeof document === "undefined") {
    return {
      accent: "#0d9488",
      grid: "#e7e5e4",
      axis: "#78716c",
      tooltipBg: "#ffffff",
      tooltipBorder: "#e7e5e4",
      tooltipText: "#1c1917",
    };
  }
  const root = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) =>
    root.getPropertyValue(name).trim() || fallback;
  return {
    accent: v("--accent", "#0d9488"),
    grid: v("--chart-grid", "#e7e5e4"),
    axis: v("--muted", "#78716c"),
    tooltipBg: v("--card", "#ffffff"),
    tooltipBorder: v("--border", "#e7e5e4"),
    tooltipText: v("--foreground", "#1c1917"),
  };
}
