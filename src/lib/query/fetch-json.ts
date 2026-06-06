export class FetchJsonError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FetchJsonError";
  }
}

function errorCodeFromResponse(
  body: { error?: string },
  status: number,
): string {
  const code = body.error?.trim();
  if (code) return code;
  if (status === 429) return "rate_limited";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  return "request_failed";
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!res.ok) {
    throw new FetchJsonError(
      errorCodeFromResponse(body, res.status),
      res.status,
    );
  }
  return body as T;
}
