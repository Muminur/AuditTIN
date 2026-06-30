import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { adminExportSchema } from "@/lib/validation";
import { getAllRecords } from "@/lib/data";
import { filterRecords, sortRecords } from "@/lib/admin";
import { recordAudit } from "@/lib/audit-log";
import { maskTin } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  const actor = session?.user?.email;
  if (!actor) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const parsed = adminExportSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const f = parsed.data;

  const all = getAllRecords();
  const filtered = sortRecords(
    filterRecords(all, {
      zone: f.zone,
      circle: f.circle,
      submissionType: f.submissionType,
      query: f.query,
    }),
    "serial",
    "asc",
  );

  // TINs masked unless an explicit, authorised unmask was requested (§3 / T4.7).
  const rows = filtered.map((r) => ({
    SL: r.serial,
    TIN: f.unmask ? r.tin : maskTin(r.tin),
    Zone: r.zone,
    Circle: r.circle,
    Type: r.submissionType,
    AY: r.assessmentYear,
  }));

  await recordAudit({
    at: new Date().toISOString(),
    actor,
    action: "export",
    detail: JSON.stringify({
      format: f.format,
      zone: f.zone || undefined,
      circle: f.circle || undefined,
      type: f.submissionType || undefined,
      query: f.query || undefined,
    }),
    rowCount: rows.length,
    unmasked: f.unmask,
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const suffix = f.unmask ? "-unmasked" : "";
  const stamp = new Date().toISOString().slice(0, 10);

  if (f.format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Selection");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="audit-${stamp}${suffix}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = XLSX.utils.sheet_to_csv(ws);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-${stamp}${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
