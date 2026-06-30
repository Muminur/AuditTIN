import { lookupQuerySchema } from "@/lib/validation";
import { lookup, getMeta } from "@/lib/data";
import { checkRateLimit, clientId } from "@/lib/ratelimit";
import type { LookupResponse, LookupMeta } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Lookup is a POST so the TIN travels in the request body — never in a URL,
 * query string, browser history, referrer, or access log (CLAUDE.md §3).
 * The TIN is never logged anywhere in this handler.
 */
export async function POST(req: Request): Promise<Response> {
  // Rate limit first (cheap, protects the rest).
  const rl = await checkRateLimit(clientId(req));
  if (!rl.ok) {
    return respond(
      { status: "rate_limited", retryAfter: rl.retryAfter },
      429,
      { "Retry-After": String(rl.retryAfter) },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return respond({ status: "invalid", reason: "empty" }, 400);
  }

  const tinValue =
    raw && typeof raw === "object" && "tin" in raw
      ? String((raw as { tin: unknown }).tin ?? "")
      : "";

  const parsed = lookupQuerySchema.safeParse({ tin: tinValue });
  if (!parsed.success) {
    const reason: "empty" | "non_digit" | "length" =
      tinValue.trim().length === 0
        ? "empty"
        : /^\d+$/.test(tinValue.trim())
          ? "length"
          : "non_digit";
    return respond({ status: "invalid", reason }, 400);
  }

  const record = lookup(parsed.data.tin);
  const meta = getMeta();
  const lookupMeta: LookupMeta = {
    assessmentYear: meta.assessmentYear,
    publishedAt: meta.publishedAt,
    label: meta.label,
    sample: meta.sample,
  };

  const body: LookupResponse = record
    ? { status: "selected", record, meta: lookupMeta }
    : { status: "not_selected", meta: lookupMeta };

  return respond(body, 200);
}

function respond(
  body: LookupResponse,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Never cache a lookup; leave no trace.
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex",
      ...extraHeaders,
    },
  });
}

// Reject other methods explicitly (no TIN ever in a GET).
export function GET(): Response {
  return new Response(JSON.stringify({ status: "error" }), {
    status: 405,
    headers: { "Content-Type": "application/json", Allow: "POST" },
  });
}
