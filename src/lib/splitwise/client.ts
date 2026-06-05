import { SPLITWISE_API_BASE } from "@/lib/splitwise/constants";
import {
  isRetryableError,
  mapSplitwiseResponseError,
  retryDelayMs,
  SplitwiseApiError,
} from "@/lib/splitwise/errors";

export type SplitwiseClientOptions = {
  accessToken: string;
  maxRetries?: number;
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
};

export type SplitwiseRequestInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SplitwiseClient {
  private readonly accessToken: string;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SplitwiseClientOptions) {
    this.accessToken = options.accessToken;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 500;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request<T>(path: string, init: SplitwiseRequestInit = {}): Promise<T> {
    const url = path.startsWith("http")
      ? path
      : `${SPLITWISE_API_BASE}/${path.replace(/^\//, "")}`;

    let lastError: SplitwiseApiError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.fetchImpl(url, {
          ...init,
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/json",
            ...init.headers,
          },
        });

        if (res.ok) {
          if (res.status === 204) {
            return undefined as T;
          }
          return (await res.json()) as T;
        }

        const body = await res.text();
        const error = mapSplitwiseResponseError(
          res.status,
          body,
          res.headers.get("Retry-After"),
        );

        if (!isRetryableError(error) || attempt === this.maxRetries) {
          throw error;
        }

        lastError = error;
        await sleep(retryDelayMs(attempt, error, this.baseDelayMs));
      } catch (err) {
        if (err instanceof SplitwiseApiError) {
          throw err;
        }
        if (attempt === this.maxRetries) {
          throw err;
        }
        await sleep(retryDelayMs(attempt, err, this.baseDelayMs));
      }
    }

    throw lastError ?? new Error("Splitwise request failed");
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export function createSplitwiseClient(
  accessToken: string,
  options?: Omit<SplitwiseClientOptions, "accessToken">,
): SplitwiseClient {
  return new SplitwiseClient({ accessToken, ...options });
}
