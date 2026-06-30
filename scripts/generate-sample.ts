/**
 * generate-sample.ts — produce a DETERMINISTIC, clearly-labelled synthetic
 * audit-selection list for development and demonstration.
 *
 * The real NBR publication is not redistributed in this repository. This
 * generator emits ~5,014 fictional records that mirror the *shape* of the
 * real list (zones, circles, submission types, AY 2023-2024) so the whole
 * pipeline and UI work end-to-end. TINs here are fabricated and match no
 * real taxpayer.
 *
 * Output: source/audit-sample.csv  (columns: SL,TIN,Zone,Circle,Type,AY)
 *
 * Deterministic: a seeded PRNG means re-running produces byte-identical output,
 * which keeps the ingest checksum and the CI row-count gate stable.
 *
 * Run: npm run generate-sample
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const TARGET = 5014;
const ASSESSMENT_YEAR = "2023-2024";

// ── Seeded PRNG (mulberry32) — deterministic across runs ──────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20232024);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}
function pickWeighted<T>(items: ReadonlyArray<{ value: T; weight: number }>): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const i of items) {
    r -= i.weight;
    if (r <= 0) return i.value;
  }
  return items[items.length - 1]!.value;
}

// ── Zones (≈25, weighted by size; Dhaka zones largest) ────────────────────
interface ZoneDef {
  name: string;
  weight: number;
  circleCount: number;
}
const DHAKA = Array.from({ length: 15 }, (_, i) => ({
  name: `Taxes Zone-${i + 1}, Dhaka`,
  weight: 6,
  circleCount: 28,
}));
const CTG = Array.from({ length: 4 }, (_, i) => ({
  name: `Taxes Zone-${i + 1}, Chattogram`,
  weight: 4,
  circleCount: 24,
}));
const OTHER_CITIES = [
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Cumilla",
  "Gazipur",
].map((city) => ({
  name: `Taxes Zone, ${city}`,
  weight: 2,
  circleCount: 18,
}));
const ZONES: ZoneDef[] = [...DHAKA, ...CTG, ...OTHER_CITIES];

// Assign each zone a contiguous block of circle numbers.
let circleCursor = 1;
const zoneCircles = new Map<string, string[]>();
for (const z of ZONES) {
  const circles: string[] = [];
  for (let c = 0; c < z.circleCount; c++) {
    circles.push(`Circle-${circleCursor + c}`);
  }
  circleCursor += z.circleCount;
  zoneCircles.set(z.name, circles);
}

const SUBMISSION_TYPES = [
  { value: "Universal Self-Assessment", weight: 7 },
  { value: "Normal", weight: 2 },
  { value: "Spot Assessment", weight: 1 },
] as const;

// ── Deliberate, *recoverable* messiness so ingest normalization is exercised:
//    a fraction of zone strings drop the "Taxes Zone-" prefix or vary casing.
function messify(zone: string): string {
  const roll = rand();
  // "Taxes Zone-16, Dhaka" → "16, Dhaka" (PDF line-wrap artefact)
  if (roll < 0.06) {
    return zone.replace(/^Taxes Zone-?/i, "").replace(/^,?\s*/, "");
  }
  // lowercase casing drift
  if (roll < 0.1) return zone.toLowerCase();
  // upper casing drift
  if (roll < 0.12) return zone.toUpperCase();
  return zone;
}

// ── Unique 12-digit TINs ──────────────────────────────────────────────────
const tins = new Set<string>();
function nextTin(): string {
  for (;;) {
    let s = String(1 + Math.floor(rand() * 9)); // first digit 1-9
    for (let i = 0; i < 11; i++) s += Math.floor(rand() * 10);
    if (!tins.has(s)) {
      tins.add(s);
      return s;
    }
  }
}

// ── Build rows ────────────────────────────────────────────────────────────
const rows: string[] = ["SL,TIN,Zone,Circle,Type,AY"];
for (let i = 1; i <= TARGET; i++) {
  const zone = pickWeighted(ZONES.map((z) => ({ value: z, weight: z.weight })));
  const circle = pick(zoneCircles.get(zone.name)!);
  const type = pickWeighted(
    SUBMISSION_TYPES.map((t) => ({ value: t.value, weight: t.weight })),
  );
  const tin = nextTin();
  const zoneCell = messify(zone.name);
  // Quote the zone cell because it contains a comma.
  rows.push(`${i},${tin},"${zoneCell}",${circle},${type},${ASSESSMENT_YEAR}`);
}

const outDir = join(ROOT, "source");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "audit-sample.csv");
writeFileSync(outPath, rows.join("\n") + "\n", "utf8");

console.log(`✓ Wrote ${TARGET} sample records → ${outPath}`);
console.log(`  Zones: ${ZONES.length} · unique TINs: ${tins.size}`);
