type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitRule = {
  pathname: string;
  limit: number;
  windowMs: number;
};

export const RATE_LIMIT_RULES: RateLimitRule[] = [
  { pathname: "/api/sync", limit: 6, windowMs: 60_000 },
  { pathname: "/api/expenses/bulk", limit: 10, windowMs: 60_000 },
  { pathname: "/api/settlements", limit: 20, windowMs: 60_000 },
  { pathname: "/api/expenses/export", limit: 6, windowMs: 60_000 },
  { pathname: "/api/demo/start", limit: 12, windowMs: 60 * 60_000 },
  { pathname: "/api/account/delete-synced-data", limit: 3, windowMs: 60_000 },
  { pathname: "/api/ai/parse-filters", limit: 20, windowMs: 60_000 },
  { pathname: "/api/ai/suggest-categories", limit: 15, windowMs: 60_000 },
  { pathname: "/api/ai/narrative", limit: 10, windowMs: 60_000 },
  { pathname: "/api/ai/settings", limit: 30, windowMs: 60_000 },
  { pathname: "/api/ai/models", limit: 30, windowMs: 60_000 },
];

/** Per-session cap on authenticated GET /api/* traffic. */
export const AUTHENTICATED_READ_RULE: RateLimitRule = {
  pathname: "__authenticated_read__",
  limit: 180,
  windowMs: 60_000,
};

function trustProxyIpHeaders(): boolean {
  if (
    process.env.TRUST_PROXY_IP === "true" ||
    process.env.TRUST_PROXY_IP === "1"
  ) {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

export function clientIpFromHeaders(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  if (!trustProxyIpHeaders()) {
    return "untrusted";
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function rateLimitRuleForPath(pathname: string): RateLimitRule | null {
  return RATE_LIMIT_RULES.find((rule) => pathname === rule.pathname) ?? null;
}

export function authenticatedReadRateLimitKey(
  ip: string,
  session: { splitwiseUserId?: number; fakeData?: boolean },
): string {
  const tenant = session.splitwiseUserId
    ? `user:${session.splitwiseUserId}`
    : session.fakeData
      ? "demo"
      : "session";
  return `${ip}:${tenant}`;
}

export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
): { allowed: boolean; retryAfterSec: number } {
  const bucketKey = `${key}:${rule.pathname}`;
  const existing = buckets.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= rule.limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return { allowed: false, retryAfterSec };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/** Test helper — clears in-memory counters between cases. */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
