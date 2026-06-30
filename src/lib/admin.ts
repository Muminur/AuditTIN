import type { AuditRecord } from "./types";

export interface AdminFilters {
  tin?: string;
  zone?: string;
  circle?: string;
  submissionType?: string;
  query?: string;
}

/** Filter records by the admin filter set. */
export function filterRecords(
  records: AuditRecord[],
  f: AdminFilters,
): AuditRecord[] {
  let out = records;
  if (f.tin) out = out.filter((r) => r.tin === f.tin);
  if (f.zone) out = out.filter((r) => r.zone === f.zone);
  if (f.circle) out = out.filter((r) => r.circle === f.circle);
  if (f.submissionType)
    out = out.filter((r) => r.submissionType === f.submissionType);
  if (f.query) {
    const q = f.query.toLowerCase();
    out = out.filter(
      (r) =>
        r.zone.toLowerCase().includes(q) ||
        r.circle.toLowerCase().includes(q),
    );
  }
  return out;
}

export type SortBy = "serial" | "tin" | "zone" | "circle";
export type SortDir = "asc" | "desc";

export function sortRecords(
  records: AuditRecord[],
  sortBy: SortBy,
  sortDir: SortDir,
): AuditRecord[] {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...records].sort((a, b) => {
    if (sortBy === "serial") return (a.serial - b.serial) * dir;
    const av = String(a[sortBy]);
    const bv = String(b[sortBy]);
    return av.localeCompare(bv, undefined, { numeric: true }) * dir;
  });
}

/** Unique, sorted facet values for filter dropdowns. */
export function facets(records: AuditRecord[]): {
  zones: string[];
  circles: string[];
  submissionTypes: string[];
} {
  const zones = new Set<string>();
  const circles = new Set<string>();
  const types = new Set<string>();
  for (const r of records) {
    zones.add(r.zone);
    circles.add(r.circle);
    types.add(r.submissionType);
  }
  const byNumeric = (a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true });
  return {
    zones: [...zones].sort(byNumeric),
    circles: [...circles].sort(byNumeric),
    submissionTypes: [...types].sort(byNumeric),
  };
}
