/** Insight / status card tones — semantic tokens, dark-mode aware. */
export const insightToneClass = {
  neutral: "border-border bg-muted-surface text-foreground",
  spend: "border-success-border bg-success-bg text-success-text",
  balance: "border-border bg-indigo-bg text-indigo-text",
  alert: "border-warn-border bg-warn-bg text-warn-text",
} as const;

export const statusBadgeClass = {
  ok: "bg-success-bg text-success-text",
  warn: "bg-warn-bg text-warn-text",
  error: "bg-error-bg text-error-text",
  neutral: "bg-muted-surface text-foreground",
} as const;

export const settingsAlertClass = {
  success: "border-success-border bg-success-bg text-success-text",
  error: "border-error-border bg-error-bg text-error-text",
  info: "border-border bg-muted-surface text-foreground",
} as const;
