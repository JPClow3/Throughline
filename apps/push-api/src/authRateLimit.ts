/**
 * Lightweight in-isolate rate limit for Worker auth endpoints.
 * Complements Fastify's @fastify/rate-limit on the Node server.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const DEFAULT_MAX = 12;

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function consumeAuthRateLimit(
  request: Request,
  options?: { max?: number; key?: string }
): { ok: true } | { ok: false; retryAfterSec: number } {
  const max = options?.max ?? DEFAULT_MAX;
  const ip = clientIp(request);
  const key = `${options?.key ?? "auth"}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (existing.count >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true };
}

/** Test helper */
export function resetAuthRateLimits() {
  buckets.clear();
}
