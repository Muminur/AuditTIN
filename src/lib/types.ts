/**
 * Shared types for the Audit Status Portal.
 * Single source of truth — no `any` on data paths (see CLAUDE.md §4).
 */

/** The submission types that appear on the NBR list. */
export const SUBMISSION_TYPES = [
  "Universal Self-Assessment",
  "Normal",
  "Spot Assessment",
] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

/** The assessment year this dataset covers. */
export const ASSESSMENT_YEAR = "2023-2024";

/** A single audit-selection record (the published fields only — no extra PII). */
export interface AuditRecord {
  /** Serial number on the source list (1-based). */
  serial: number;
  /** 12-digit TIN (string to preserve leading zeros). */
  tin: string;
  /** Normalised tax zone, e.g. "Taxes Zone-16, Dhaka". */
  zone: string;
  /** Circle within the zone, e.g. "Circle-301". */
  circle: string;
  /** Submission type. */
  submissionType: SubmissionType;
  /** Assessment year, e.g. "2023-2024". */
  assessmentYear: string;
}

/**
 * The public-facing slice of a record returned to the browser.
 * Identical fields today, but kept as a separate type so we can never
 * accidentally widen the lookup payload beyond what is published.
 */
export type PublicRecord = AuditRecord;

/** The TIN-keyed map bundled into the app: { [tin]: AuditRecord }. */
export type AuditDataset = Record<string, AuditRecord>;

/** Metadata about the bundled dataset. */
export interface AuditMeta {
  /** Human-readable source label, e.g. "AUDIT_SELECTION_V3". */
  label: string;
  /** Source file name the data was ingested from. */
  sourceFile: string;
  /** ISO date the NBR list was published. */
  publishedAt: string;
  /** ISO timestamp the dataset was generated at build time. */
  generatedAt: string;
  /** Assessment year covered. */
  assessmentYear: string;
  /** Number of records. */
  count: number;
  /** SHA-256 checksum of the canonicalised dataset (integrity / CI gate). */
  sha256: string;
  /** True when the bundled data is synthetic sample data, not the real list. */
  sample: boolean;
}

/** A single (label, count) aggregate row. */
export interface CountRow {
  label: string;
  count: number;
}

/** A circle aggregate, retaining its parent zone for disambiguation. */
export interface CircleCountRow {
  zone: string;
  circle: string;
  count: number;
}

/** The public statistics payload — counts only, never any TIN. */
export interface StatsPayload {
  totalSelected: number;
  zonesCount: number;
  circlesCount: number;
  byZone: CountRow[];
  topCircles: CircleCountRow[];
  byType: CountRow[];
  assessmentYear: string;
  publishedAt: string;
  label: string;
  sample: boolean;
}

/** Discriminated result of a lookup. */
export type LookupResponse =
  | { status: "selected"; record: PublicRecord; meta: LookupMeta }
  | { status: "not_selected"; meta: LookupMeta }
  | { status: "invalid"; reason: "length" | "non_digit" | "empty" }
  | { status: "rate_limited"; retryAfter: number }
  | { status: "error" };

/** Lightweight dataset context attached to a successful lookup. */
export interface LookupMeta {
  assessmentYear: string;
  publishedAt: string;
  label: string;
  sample: boolean;
}

/** /api/health payload. */
export interface HealthPayload {
  ok: boolean;
  count: number;
  assessmentYear: string;
  publishedAt: string;
  sha256: string;
  buildSha: string;
  sample: boolean;
}

/** Admin search request (validated with Zod at the route). */
export interface AdminSearchRequest {
  tin?: string;
  zone?: string;
  circle?: string;
  submissionType?: string;
  query?: string;
  page: number;
  pageSize: number;
  sortBy: "serial" | "tin" | "zone" | "circle";
  sortDir: "asc" | "desc";
}

/** Admin search response — TINs masked unless explicitly exported unmasked. */
export interface AdminSearchResponse {
  rows: Array<AuditRecord & { tinMasked: string }>;
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  zones: string[];
  circles: string[];
  submissionTypes: string[];
}

/** An entry in the admin audit log (stored in KV). */
export interface AuditLogEntry {
  at: string;
  actor: string;
  action: "search" | "export";
  detail: string;
  rowCount: number;
  unmasked?: boolean;
}
