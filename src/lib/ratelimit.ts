import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

/**
 * Per-connection rate limiting for /api/lookup (privacy guardrail §3).
 *
 * Production: Upstash sliding window via Vercel KV (cross-instance, durable).
 * Local/dev without KV: an in-memory per-isolate fallback so the app still
 * runs — clearly not authoritative across instances, but adequate for dev.
 *
 * The identifier is a coarse client fingerprint (IP-ish). The TIN is NEVER
 * used as part of any key and is never passed to this module.
 */

const PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE ?? "10");
const PER_DAY = Number(process.env.RATE_LIMIT_PER_DAY ?? "100");

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

const minuteLimiter = hasKv
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(PER_MINUTE, "60 s"),
      prefix: "rl:lookup:min",
      analytics: false,
    })
  : null;

const dayLimiter = hasKv
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(PER_DAY, "1 d"),
      prefix: "rl:lookup:day",
      analytics: false,
    })
  : null;

// ── In-memory fallback (dev only) ──────────────────────────────────────────
const memBuckets = new Map<string, number[]>();
function memCheck(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; reset: number } {
  const now = Date.now();
  const hits = (memBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    return { success: false, reset: oldest + windowMs };
  }
  hits.push(now);
  memBuckets.set(key, hits);
  return { success: true, reset: now + windowMs };
}

export interface RateResult {
  ok: boolean;
  retryAfter: number; // seconds
}

export async function checkRateLimit(id: string): Promise<RateResult> {
  if (minuteLimiter && dayLimiter) {
    const [m, d] = await Promise.all([
      minuteLimiter.limit(`m:${id}`),
      dayLimiter.limit(`d:${id}`),
    ]);
    if (!m.success) {
      return { ok: false, retryAfter: secsUntil(m.reset) };
    }
    if (!d.success) {
      return { ok: false, retryAfter: secsUntil(d.reset) };
    }
    return { ok: true, retryAfter: 0 };
  }

  const m = memCheck(`m:${id}`, PER_MINUTE, 60_000);
  if (!m.success) return { ok: false, retryAfter: secsUntil(m.reset) };
  const d = memCheck(`d:${id}`, PER_DAY, 86_400_000);
  if (!d.success) return { ok: false, retryAfter: secsUntil(d.reset) };
  return { ok: true, retryAfter: 0 };
}

function secsUntil(resetMs: number): number {
  return Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
}

/** Coarse client identifier from proxy headers — for rate limiting only. */
export function clientId(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "anonymous"
  );
}
