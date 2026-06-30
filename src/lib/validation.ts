import { z } from "zod";
import { SUBMISSION_TYPES } from "./types";

/** A TIN is exactly 12 digits — the defining privacy control. */
export const tinSchema = z
  .string()
  .trim()
  .regex(/^\d{12}$/, "TIN must be exactly 12 digits");

/** Assessment year, e.g. "2023-2024". */
export const assessmentYearSchema = z.string().regex(/^\d{4}-\d{4}$/);

export const submissionTypeSchema = z.enum(SUBMISSION_TYPES);

/** A fully-validated audit record (used by the ingest pipeline). */
export const auditRecordSchema = z.object({
  serial: z.number().int().positive(),
  tin: tinSchema,
  zone: z.string().min(1),
  circle: z.string().min(1),
  submissionType: submissionTypeSchema,
  assessmentYear: assessmentYearSchema,
});

/** Query parameters accepted by GET /api/lookup. */
export const lookupQuerySchema = z.object({
  tin: tinSchema,
});

/** Classify a raw TIN string into a precise validation failure for UX copy. */
export function classifyTin(
  raw: string,
): { ok: true; tin: string } | { ok: false; reason: "empty" | "non_digit" | "length"; length: number } {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, reason: "empty", length: 0 };
  if (!/^\d+$/.test(value)) {
    return {
      ok: false,
      reason: "non_digit",
      length: value.replace(/\D/g, "").length,
    };
  }
  if (value.length !== 12) {
    return { ok: false, reason: "length", length: value.length };
  }
  return { ok: true, tin: value };
}

/** POST body for /api/admin/search. */
export const adminSearchSchema = z.object({
  tin: z
    .string()
    .trim()
    .regex(/^\d{12}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  zone: z.string().trim().optional(),
  circle: z.string().trim().optional(),
  submissionType: z.string().trim().optional(),
  query: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(200).default(50),
  sortBy: z.enum(["serial", "tin", "zone", "circle"]).default("serial"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

/** Query params for /api/admin/export. */
export const adminExportSchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("csv"),
  unmask: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  zone: z.string().trim().optional(),
  circle: z.string().trim().optional(),
  submissionType: z.string().trim().optional(),
  query: z.string().trim().max(120).optional(),
});

export type AdminSearchInput = z.infer<typeof adminSearchSchema>;
export type AdminExportInput = z.infer<typeof adminExportSchema>;
