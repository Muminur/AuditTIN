/**
 * ingest.ts — build-time data pipeline (runs via `prebuild`).
 *
 *   source/*.csv (preferred) or source/*.pdf (fallback)
 *     → parse rows (SL | TIN | Zone | Circle | Type | AY)
 *     → normalize zones (fix line-wrap, unify casing) + submission types
 *     → Zod-validate each row (collect + report rejects)
 *     → dedupe by TIN (warn on collision)
 *     → emit:
 *         data/audit-2023-2024.json  (TIN-keyed map)
 *         data/meta.json             (source, publishedAt, count, sha256)
 *         data/stats.json            (zone/circle/type aggregates — NO TINs)
 *
 * CI gate: throws (failing the build) on schema-invalid data, zero rows, or a
 * reject rate above MAX_REJECT_RATE, or count drift beyond DRIFT_PCT when an
 * EXPECTED_COUNT baseline is provided.
 *
 * Privacy: stats.json contains counts only — never a TIN.
 */
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import Papa from "papaparse";
import {
  AuditRecord,
  AuditDataset,
  AuditMeta,
  StatsPayload,
  CountRow,
  CircleCountRow,
} from "../src/lib/types";
import { auditRecordSchema } from "../src/lib/validation";
import {
  normalizeZone,
  normalizeSubmissionType,
  normalizeCircle,
} from "../src/lib/normalize";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE_DIR = join(ROOT, "source");
const DATA_DIR = join(ROOT, "data");

const ASSESSMENT_YEAR = process.env.AY ?? "2023-2024";
const PUBLISHED_AT = process.env.DATASET_DATE ?? "2024-06-29";
const MAX_REJECT_RATE = Number(process.env.MAX_REJECT_RATE ?? "0.02");
const EXPECTED_COUNT = process.env.EXPECTED_COUNT
  ? Number(process.env.EXPECTED_COUNT)
  : null;
const DRIFT_PCT = Number(process.env.DRIFT_PCT ?? "0.1");

// ── Source discovery + parsing ──────────────────────────────────────────────

interface RawRow {
  SL?: string;
  TIN?: string;
  Zone?: string;
  Circle?: string;
  Type?: string;
  AY?: string;
}

function findSource(): { path: string; kind: "csv" | "pdf" } | null {
  if (!existsSync(SOURCE_DIR)) return null;
  const files = readdirSync(SOURCE_DIR).filter((f) => !f.startsWith("."));
  const csv = files.find((f) => extname(f).toLowerCase() === ".csv");
  if (csv) return { path: join(SOURCE_DIR, csv), kind: "csv" };
  const pdf = files.find((f) => extname(f).toLowerCase() === ".pdf");
  if (pdf) return { path: join(SOURCE_DIR, pdf), kind: "pdf" };
  return null;
}

function parseCsv(path: string): RawRow[] {
  const text = readFileSync(path, "utf8");
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

/** Best-effort PDF fallback: extract text and parse tabular lines. */
async function parsePdf(path: string): Promise<RawRow[]> {
  // Use the legacy build for Node (no DOM).
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(path));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const rows: RawRow[] = [];
  const line =
    /^(\d+)\s+(\d{12})\s+(.+?)\s+(Circle-?\s*\d+)\s+(.+?)\s+(\d{4}-\d{4})$/i;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    for (const raw of text.split(/\n|(?=\d+\s+\d{12}\s)/)) {
      const m = raw.trim().match(line);
      if (m) {
        rows.push({
          SL: m[1],
          TIN: m[2],
          Zone: m[3],
          Circle: m[4],
          Type: m[5],
          AY: m[6],
        });
      }
    }
  }
  return rows;
}

// ── Build ───────────────────────────────────────────────────────────────────

function canonicalStringify(value: unknown): string {
  // Stable key ordering so the checksum is deterministic.
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (v as Record<string, unknown>)[k];
          return acc;
        }, {});
    }
    return v;
  });
}

async function main() {
  const src = findSource();
  if (!src) {
    throw new Error(
      `No source file found in ${SOURCE_DIR}. Drop a .csv (preferred) or .pdf, ` +
        `or run \`npm run generate-sample\` to create demo data.`,
    );
  }
  console.log(`→ Ingesting ${src.kind.toUpperCase()}: ${basename(src.path)}`);

  const rawRows =
    src.kind === "csv" ? parseCsv(src.path) : await parsePdf(src.path);

  const dataset: AuditDataset = {};
  const rejects: Array<{ line: number; reason: string }> = [];
  let collisions = 0;
  let serialAuto = 0;

  rawRows.forEach((row, idx) => {
    const lineNo = idx + 2; // +1 header, +1 to 1-base
    const tin = String(row.TIN ?? "").trim();
    const zone = normalizeZone(String(row.Zone ?? ""));
    const circle = normalizeCircle(String(row.Circle ?? ""));
    const submissionType = normalizeSubmissionType(String(row.Type ?? ""));
    const assessmentYear = String(row.AY ?? ASSESSMENT_YEAR).trim();
    const serial = Number(row.SL) || ++serialAuto;

    if (submissionType === null) {
      rejects.push({ line: lineNo, reason: `unknown submission type "${row.Type}"` });
      return;
    }

    const candidate: AuditRecord = {
      serial,
      tin,
      zone,
      circle,
      submissionType,
      assessmentYear,
    };

    const parsed = auditRecordSchema.safeParse(candidate);
    if (!parsed.success) {
      const reason = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      rejects.push({ line: lineNo, reason });
      return;
    }

    if (dataset[parsed.data.tin]) {
      collisions++;
      console.warn(
        `  ! duplicate TIN at line ${lineNo} (keeping first occurrence)`,
      );
      return;
    }
    dataset[parsed.data.tin] = parsed.data;
  });

  const records = Object.values(dataset);
  const count = records.length;

  // ── CI gate ──────────────────────────────────────────────────────────────
  if (count === 0) {
    throw new Error("Ingest produced 0 valid records — failing build.");
  }
  const rejectRate = rejects.length / Math.max(1, rawRows.length);
  if (rejectRate > MAX_REJECT_RATE) {
    reportRejects(rejects);
    throw new Error(
      `Reject rate ${(rejectRate * 100).toFixed(2)}% exceeds ` +
        `${(MAX_REJECT_RATE * 100).toFixed(2)}% — failing build.`,
    );
  }
  if (EXPECTED_COUNT !== null) {
    const drift = Math.abs(count - EXPECTED_COUNT) / EXPECTED_COUNT;
    if (drift > DRIFT_PCT) {
      throw new Error(
        `Row count ${count} drifts ${(drift * 100).toFixed(1)}% from ` +
          `expected ${EXPECTED_COUNT} (limit ${(DRIFT_PCT * 100).toFixed(0)}%) — failing build.`,
      );
    }
  }

  // ── Emit ───────────────────────────────────────────────────────────────────
  mkdirSync(DATA_DIR, { recursive: true });

  const datasetJson = canonicalStringify(dataset);
  const sha256 = createHash("sha256").update(datasetJson).digest("hex");

  const isSample = /sample/i.test(basename(src.path));
  const meta: AuditMeta = {
    label:
      process.env.DATASET_LABEL ??
      (isSample ? "AUDIT_SELECTION_V3 (sample)" : "AUDIT_SELECTION_V3"),
    sourceFile: basename(src.path),
    publishedAt: PUBLISHED_AT,
    generatedAt: new Date().toISOString(),
    assessmentYear: ASSESSMENT_YEAR,
    count,
    sha256,
    sample: isSample,
  };

  const stats = buildStats(records, meta);

  writeFileSync(join(DATA_DIR, "audit-2023-2024.json"), datasetJson + "\n");
  writeFileSync(
    join(DATA_DIR, "meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
  );
  writeFileSync(
    join(DATA_DIR, "stats.json"),
    JSON.stringify(stats, null, 2) + "\n",
  );

  console.log(`✓ ${count} records · ${stats.zonesCount} zones · ${stats.circlesCount} circles`);
  console.log(`  sha256 ${sha256.slice(0, 16)}… · sample=${isSample}`);
  if (rejects.length) {
    console.log(`  rejected ${rejects.length} row(s) (${(rejectRate * 100).toFixed(2)}%)`);
    reportRejects(rejects.slice(0, 10));
  }
  if (collisions) console.log(`  ${collisions} duplicate TIN(s) dropped`);
}

function reportRejects(rejects: Array<{ line: number; reason: string }>) {
  for (const r of rejects) console.warn(`  ✗ line ${r.line}: ${r.reason}`);
}

function buildStats(records: AuditRecord[], meta: AuditMeta): StatsPayload {
  const zoneMap = new Map<string, number>();
  const circleMap = new Map<string, CircleCountRow>();
  const typeMap = new Map<string, number>();

  for (const r of records) {
    zoneMap.set(r.zone, (zoneMap.get(r.zone) ?? 0) + 1);
    typeMap.set(r.submissionType, (typeMap.get(r.submissionType) ?? 0) + 1);
    const key = `${r.zone}||${r.circle}`;
    const existing = circleMap.get(key);
    if (existing) existing.count++;
    else circleMap.set(key, { zone: r.zone, circle: r.circle, count: 1 });
  }

  const byZone: CountRow[] = [...zoneMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const byType: CountRow[] = [...typeMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const topCircles = [...circleMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    totalSelected: records.length,
    zonesCount: zoneMap.size,
    circlesCount: circleMap.size,
    byZone,
    topCircles,
    byType,
    assessmentYear: meta.assessmentYear,
    publishedAt: meta.publishedAt,
    label: meta.label,
    sample: meta.sample,
  };
}

main().catch((err) => {
  console.error("\n✗ Ingest failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
