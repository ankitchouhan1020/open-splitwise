import { FetchJsonError } from "@/lib/query/fetch-json";

const API_ERROR_MESSAGES: Record<string, string> = {
  // Auth & session
  not_connected: "Connect Splitwise in Settings to use this feature.",
  unauthorized: "Your session expired. Connect to Splitwise again in Settings.",
  connect_required: "Connect Splitwise to use this app.",
  forbidden: "That action isn't allowed.",
  fake_data_read_only:
    "Sample data is read-only. Connect Splitwise to make changes.",

  // Infrastructure
  database_not_configured:
    "Database not configured. Set DATABASE_URL and run migrations in Settings → Server.",
  server_misconfigured:
    "This server isn't set up correctly. Check Settings → Server.",
  service_unavailable: "This feature isn't available on this server.",
  request_failed: "Something went wrong. Try again.",
  invalid_json: "Something went wrong. Try again.",

  // Rate limits
  rate_limited: "Too many requests. Wait a moment and try again.",

  // Splitwise
  splitwise_auth_required:
    "Your Splitwise connection expired. Reconnect in Settings.",
  account_not_found: "Reconnect Splitwise in Settings.",
  splitwise_validation: "Splitwise rejected this expense.",
  splitwise_unavailable:
    "Splitwise is temporarily unavailable. Try again in a moment.",
  splitwise_error: "Splitwise rejected the request. Try again.",

  // AI
  ai_disabled: "Turn on AI in Settings → AI.",
  ai_misconfigured: "Check your API key and model in Settings → AI.",
  ai_provider_error:
    "Couldn't reach your AI provider. Check your API key in Settings → AI.",
  ai_parse_error:
    "Couldn't understand the AI response. Try rephrasing your question.",
  narrative_insufficient_data:
    "Not enough spending data yet for a summary. Sync and try again later.",
  ai_error: "Something went wrong with AI. Try again.",
  ai_key_required: "Add an API key in Settings → AI.",
  ai_base_url_required: "Enter a base URL for your custom AI provider.",
  invalid_body: "Couldn't save those settings. Try again.",

  // Expenses
  group_required: "Select a group.",
  group_or_friend_required: "Select a group or a friend.",
  friend_required: "Select a friend.",
  missing_fields: "Fill in all required fields.",
  not_found: "That expense wasn't found. Try syncing.",
  invalid_id: "That expense wasn't found.",
  create_failed: "Couldn't create the expense. Try again.",
  delete_failed: "Couldn't delete the expense. Try again.",
  update_failed: "Couldn't update the expense. Try again.",
  payment_not_editable: "Settlements can't be edited here.",
  group_expense_only: "Only group and friend expenses can be edited.",
  invalid_split: "Check the split amounts and try again.",
  split_total_mismatch: "Split amounts must add up to the total.",
  participants_required: "Select at least one person for the split.",
  settlement_failed: "Couldn't record the payment. Try again.",
  batch_too_large: "Too many expenses in one batch. Add fewer at a time.",
  empty_batch: "Add at least one expense.",
  currency_required: "Select a currency.",
  items_required: "Add at least one line item.",

  // Sync
  sync_failed: "Sync failed. Try again from the header or Settings → Sync.",
  sync_in_progress: "A sync is already running. Wait for it to finish.",
};

const EXPENSE_FIELD_LABELS: Record<string, string> = {
  base: "Expense",
  cost: "Amount",
  description: "Description",
  currency_code: "Currency",
  category_id: "Category",
  group_id: "Group",
  date: "Date",
  details: "Notes",
};

function looksLikeApiCode(value: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(value);
}

/** Map a machine-readable API `error` code to user-facing copy. */
export function friendlyApiError(
  code: string | undefined,
  fallback = "Something went wrong. Try again.",
): string {
  if (!code?.trim()) return fallback;
  const trimmed = code.trim();
  const mapped = API_ERROR_MESSAGES[trimmed];
  if (mapped) return mapped;
  if (!looksLikeApiCode(trimmed)) {
    return friendlySyncError(trimmed) ?? trimmed;
  }
  return fallback;
}

/** Map fetch / mutation failures to user-facing copy. */
export function friendlyFetchError(
  err: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (err instanceof FetchJsonError) {
    return friendlyApiError(err.message, fallback);
  }
  if (err instanceof Error && err.message.trim()) {
    return friendlyApiError(err.message, fallback);
  }
  return fallback;
}

/** Sanitize stored sync error strings for display. */
export function friendlySyncError(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  const mapped = API_ERROR_MESSAGES[trimmed];
  if (mapped) return mapped;

  const lower = trimmed.toLowerCase();
  if (lower.includes("auth") || lower.includes("401")) {
    return API_ERROR_MESSAGES.splitwise_auth_required!;
  }
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "Splitwise is rate-limiting requests. Wait a minute and try again.";
  }
  if (lower.includes("already in progress")) {
    return API_ERROR_MESSAGES.sync_in_progress!;
  }
  if (lower.includes("forbidden") || lower.includes("403")) {
    return "Splitwise denied access. Reconnect in Settings.";
  }
  if (lower.startsWith("splitwise")) {
    return "Couldn't sync with Splitwise. Try again from the header.";
  }
  if (looksLikeApiCode(trimmed)) {
    return API_ERROR_MESSAGES.sync_failed!;
  }
  if (trimmed.length > 120) {
    return API_ERROR_MESSAGES.sync_failed!;
  }
  return trimmed;
}

function formatValidationDetails(details: Record<string, string[]>): string {
  const parts = Object.entries(details).flatMap(([field, messages]) => {
    const label = EXPENSE_FIELD_LABELS[field] ?? field.replace(/_/g, " ");
    return messages.map((msg) => `${label}: ${msg}`);
  });
  return parts.join(" ");
}

/** User-facing copy for expense create / update / delete failures. */
export function friendlyExpenseError(
  code: string | undefined,
  details?: Record<string, string[]>,
  fallback = "Couldn't save that expense. Try again.",
): string {
  const base = friendlyApiError(code, fallback);
  if (!details || Object.keys(details).length === 0) return base;
  const detailText = formatValidationDetails(details);
  if (code === "splitwise_validation") {
    return detailText || base;
  }
  return detailText ? `${base} ${detailText}` : base;
}

/** Context-specific AI error copy. */
export function friendlyAiError(
  code: string | undefined,
  context: "filter" | "narrative" | "settings" | "category" = "filter",
): string {
  const fallbacks: Record<typeof context, string> = {
    filter: "Couldn't apply that filter. Try rephrasing.",
    narrative: "Couldn't generate a summary. Try again.",
    settings: "Couldn't update AI settings. Try again.",
    category: "Couldn't suggest categories. Try again.",
  };
  return friendlyApiError(code, fallbacks[context]);
}
