import { AiError } from "@/lib/ai/types";
import { SplitwiseApiError, SplitwiseAuthError } from "@/lib/splitwise/errors";
import { SyncAlreadyInProgressError } from "@/lib/sync/run";
import { NextResponse } from "next/server";

type JsonErrorBody = {
  error: string;
  details?: Record<string, string[]>;
};

const DOMAIN_ERROR_STATUS: Record<string, number> = {
  not_connected: 401,
  unauthorized: 401,
  connect_required: 401,
  splitwise_auth_required: 401,

  ai_disabled: 403,
  forbidden: 403,
  fake_data_read_only: 403,

  not_found: 404,
  demo_disabled: 404,

  rate_limited: 429,

  sync_in_progress: 409,

  database_not_configured: 503,
  server_misconfigured: 503,
  service_unavailable: 503,

  splitwise_unavailable: 502,
  ai_parse_error: 502,
};

const CLIENT_ERROR_CODES = new Set([
  "invalid_json",
  "invalid_body",
  "invalid_id",
  "invalid_group",
  "invalid_items",
  "group_required",
  "group_or_friend_required",
  "friend_required",
  "missing_fields",
  "currency_required",
  "items_required",
  "splitwise_validation",
  "payment_not_editable",
  "group_expense_only",
  "invalid_split",
  "split_total_mismatch",
  "participants_required",
  "settlement_failed",
  "account_not_found",
  "ai_misconfigured",
  "ai_key_required",
  "ai_base_url_required",
  "batch_too_large",
  "empty_batch",
  "create_failed",
  "update_failed",
  "delete_failed",
  "bulk_create_failed",
  "no_expense_returned",
  "splitwise_error",
]);

/** Map a machine-readable domain error code to an HTTP status. */
export function httpStatusForErrorCode(code: string): number {
  const mapped = DOMAIN_ERROR_STATUS[code];
  if (mapped != null) return mapped;
  if (CLIENT_ERROR_CODES.has(code)) return 400;
  if (code === "ai_provider_error") return 400;
  if (
    code === "ai_error" ||
    code === "request_failed" ||
    code === "sync_failed"
  ) {
    return 500;
  }
  if (/^[a-z][a-z0-9_]*$/.test(code)) return 400;
  return 500;
}

function httpStatusForAiError(err: AiError): number {
  switch (err.code) {
    case "ai_disabled":
      return 403;
    case "ai_misconfigured":
      return 400;
    case "ai_parse_error":
      return 502;
    case "ai_provider_error": {
      const status = err.status;
      if (status === 401 || status === 403) return 400;
      if (status === 429) return 429;
      if (status === 408 || status === 504) return 504;
      if (status != null && status >= 500) return 502;
      return 400;
    }
    default:
      return 500;
  }
}

export function jsonError(
  code: string,
  init?: {
    status?: number;
    details?: Record<string, string[]>;
    headers?: HeadersInit;
  },
): NextResponse<JsonErrorBody> {
  const status = init?.status ?? httpStatusForErrorCode(code);
  const body: JsonErrorBody = { error: code };
  if (init?.details) body.details = init.details;
  const response = NextResponse.json(body, { status });
  if (init?.headers) {
    for (const [key, value] of Object.entries(init.headers)) {
      if (typeof value === "string") response.headers.set(key, value);
    }
  }
  return response;
}

export function domainErrorResponse(result: {
  error: string;
  details?: Record<string, string[]>;
}): NextResponse {
  return jsonError(result.error, {
    status: httpStatusForErrorCode(result.error),
    details: result.details,
  });
}

export function splitwiseErrorResponse(err: SplitwiseApiError): NextResponse {
  if (err instanceof SplitwiseAuthError) {
    return jsonError("splitwise_auth_required", { status: 401 });
  }
  if (err.code === "rate_limited") {
    const headers: HeadersInit = {};
    if (err.retryAfterSeconds != null) {
      headers["Retry-After"] = String(err.retryAfterSeconds);
    }
    return jsonError("rate_limited", { status: 429, headers });
  }
  if (err.code === "forbidden") {
    return jsonError("forbidden", { status: 403 });
  }
  if (err.code === "not_found") {
    return jsonError("not_found", { status: 404 });
  }
  if (err.code === "server_error" || err.status >= 500) {
    return jsonError("splitwise_unavailable", { status: 502 });
  }
  return jsonError("splitwise_error", { status: 400 });
}

export function aiErrorResponse(err: unknown): NextResponse {
  if (err instanceof AiError) {
    return jsonError(err.code, { status: httpStatusForAiError(err) });
  }
  return jsonError("ai_error", { status: 500 });
}

/** Map thrown route errors to stable codes; reserve 5xx for unexpected failures. */
export function routeErrorResponse(
  err: unknown,
  fallbackCode = "request_failed",
): NextResponse {
  if (err instanceof SyncAlreadyInProgressError) {
    return jsonError("sync_in_progress", { status: 409 });
  }
  if (err instanceof SplitwiseAuthError) {
    return jsonError("splitwise_auth_required", { status: 401 });
  }
  if (err instanceof SplitwiseApiError) {
    return splitwiseErrorResponse(err);
  }
  if (err instanceof AiError) {
    return aiErrorResponse(err);
  }
  return jsonError(fallbackCode, { status: 500 });
}
