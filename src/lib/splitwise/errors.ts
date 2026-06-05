export type SplitwiseErrorCode =
  | "auth_required"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "server_error"
  | "api_error";

export class SplitwiseApiError extends Error {
  readonly status: number;
  readonly code: SplitwiseErrorCode;
  readonly retryAfterSeconds: number | null;
  readonly body: string;

  constructor(
    message: string,
    options: {
      status: number;
      code: SplitwiseErrorCode;
      retryAfterSeconds?: number | null;
      body?: string;
    },
  ) {
    super(message);
    this.name = "SplitwiseApiError";
    this.status = options.status;
    this.code = options.code;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
    this.body = options.body ?? "";
  }
}

export class SplitwiseAuthError extends SplitwiseApiError {
  constructor(message = "Splitwise authentication required", body = "") {
    super(message, { status: 401, code: "auth_required", body });
    this.name = "SplitwiseAuthError";
  }
}

export class SplitwiseForbiddenError extends SplitwiseApiError {
  constructor(message = "Splitwise request forbidden", body = "") {
    super(message, { status: 403, code: "forbidden", body });
    this.name = "SplitwiseForbiddenError";
  }
}

export class SplitwiseNotFoundError extends SplitwiseApiError {
  constructor(message = "Splitwise resource not found", body = "") {
    super(message, { status: 404, code: "not_found", body });
    this.name = "SplitwiseNotFoundError";
  }
}

export class SplitwiseRateLimitError extends SplitwiseApiError {
  constructor(
    message = "Splitwise rate limit exceeded",
    retryAfterSeconds: number | null = null,
    body = "",
  ) {
    super(message, {
      status: 429,
      code: "rate_limited",
      retryAfterSeconds,
      body,
    });
    this.name = "SplitwiseRateLimitError";
  }
}

export class SplitwiseServerError extends SplitwiseApiError {
  constructor(status: number, message = "Splitwise server error", body = "") {
    super(message, { status, code: "server_error", body });
    this.name = "SplitwiseServerError";
  }
}

export function parseRetryAfterSeconds(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds;
  const date = Date.parse(header);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return null;
}

export function mapSplitwiseResponseError(
  status: number,
  body: string,
  retryAfterHeader: string | null,
): SplitwiseApiError {
  const snippet = body.slice(0, 200);
  switch (status) {
    case 401:
      return new SplitwiseAuthError(
        `Splitwise authentication failed: ${snippet}`,
        body,
      );
    case 403:
      return new SplitwiseForbiddenError(
        `Splitwise forbidden: ${snippet}`,
        body,
      );
    case 404:
      return new SplitwiseNotFoundError(
        `Splitwise not found: ${snippet}`,
        body,
      );
    case 429:
      return new SplitwiseRateLimitError(
        `Splitwise rate limited: ${snippet}`,
        parseRetryAfterSeconds(retryAfterHeader),
        body,
      );
    default:
      if (status >= 500) {
        return new SplitwiseServerError(
          status,
          `Splitwise server error (${status}): ${snippet}`,
          body,
        );
      }
      return new SplitwiseApiError(
        `Splitwise API error (${status}): ${snippet}`,
        {
          status,
          code: "api_error",
          body,
        },
      );
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof SplitwiseRateLimitError) return true;
  if (error instanceof SplitwiseServerError) return true;
  return false;
}

export function retryDelayMs(
  attempt: number,
  error: unknown,
  baseDelayMs: number,
): number {
  if (error instanceof SplitwiseRateLimitError && error.retryAfterSeconds) {
    return error.retryAfterSeconds * 1000;
  }
  return baseDelayMs * 2 ** attempt;
}
