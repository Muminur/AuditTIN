import { auth } from "@/lib/auth";
import { adminSearchSchema } from "@/lib/validation";
import { getAllRecords } from "@/lib/data";
import { filterRecords, sortRecords, facets } from "@/lib/admin";
import { recordAudit } from "@/lib/audit-log";
import { maskTin } from "@/lib/utils";
import type { AdminSearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  const actor = session?.user?.email;
  if (!actor) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const parsed = adminSearchSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid_request" }, 400);
  const f = parsed.data;

  const all = getAllRecords();
  const filtered = sortRecords(
    filterRecords(all, {
      tin: f.tin,
      zone: f.zone,
      circle: f.circle,
      submissionType: f.submissionType,
      query: f.query,
    }),
    f.sortBy,
    f.sortDir,
  );

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / f.pageSize));
  const page = Math.min(f.page, pages);
  const start = (page - 1) * f.pageSize;
  const slice = filtered.slice(start, start + f.pageSize);
  const fac = facets(all);

  // Browse view NEVER carries the real TIN over the wire — masked by default.
  const rows = slice.map((r) => ({
    ...r,
    tin: maskTin(r.tin),
    tinMasked: maskTin(r.tin),
  }));

  const response: AdminSearchResponse = {
    rows,
    total,
    page,
    pageSize: f.pageSize,
    pages,
    zones: fac.zones,
    circles: fac.circles,
    submissionTypes: fac.submissionTypes,
  };

  await recordAudit({
    at: new Date().toISOString(),
    actor,
    action: "search",
    detail: JSON.stringify({
      zone: f.zone || undefined,
      circle: f.circle || undefined,
      type: f.submissionType || undefined,
      query: f.query || undefined,
      tin: f.tin ? maskTin(f.tin) : undefined, // never log a full TIN
    }),
    rowCount: total,
  });

  return json(response, 200);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
