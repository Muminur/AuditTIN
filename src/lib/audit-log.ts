import { kv } from "@vercel/kv";
import type { AuditLogEntry } from "./types";

const KEY = "audit:log";
const MAX_ENTRIES = 2000;
const RETAIN_MS = 90 * 24 * 60 * 60 * 1000; // 90-day retention

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Append an admin-access entry. No-op when KV is not configured (dev). */
export async function recordAudit(entry: AuditLogEntry): Promise<void> {
  if (!hasKv) return;
  try {
    await kv.lpush(KEY, entry);
    await kv.ltrim(KEY, 0, MAX_ENTRIES - 1);
  } catch {
    // Never let audit logging break the request.
  }
}

/** Read the most recent entries, dropping anything past the retention window. */
export async function recentAudit(limit = 50): Promise<AuditLogEntry[]> {
  if (!hasKv) return [];
  try {
    const raw = await kv.lrange<AuditLogEntry | string>(KEY, 0, limit - 1);
    const now = Date.now();
    return raw
      .map((r) =>
        typeof r === "string" ? (JSON.parse(r) as AuditLogEntry) : r,
      )
      .filter((e) => now - new Date(e.at).getTime() < RETAIN_MS);
  } catch {
    return [];
  }
}

export { hasKv as auditLogEnabled };
