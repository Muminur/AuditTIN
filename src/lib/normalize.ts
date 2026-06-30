import type { SubmissionType } from "./types";

/**
 * Pure normalization helpers shared by the ingest pipeline and unit tests.
 * Keeping these out of `scripts/ingest.ts` means tests can import them without
 * triggering the script's `main()` side effects.
 */

export const KNOWN_CITIES = [
  "Dhaka",
  "Chattogram",
  "Chittagong",
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
  "Barisal",
  "Rangpur",
  "Cumilla",
  "Comilla",
  "Gazipur",
  "Mymensingh",
  "Narayanganj",
  "Bogura",
  "Bogra",
];

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function normalizeCity(raw: string): string {
  const t = titleCase(raw.trim());
  const map: Record<string, string> = {
    Chittagong: "Chattogram",
    Comilla: "Cumilla",
    Barisal: "Barishal",
    Bogra: "Bogura",
  };
  return map[t] ?? t;
}

/**
 * Normalize a zone string. Handles:
 *  - canonical "Taxes Zone-16, Dhaka"
 *  - PDF line-wrap artefact "16, Dhaka" → "Taxes Zone-16, Dhaka"
 *  - casing drift "taxes zone-3, dhaka" / "TAXES ZONE, KHULNA"
 *  - cityless "Taxes Zone, Khulna" (no number)
 */
export function normalizeZone(raw: string): string {
  const s = String(raw).replace(/\s+/g, " ").trim();
  if (!s) return "";

  let zonePart = s;
  let cityPart = "";
  const lastComma = s.lastIndexOf(",");
  if (lastComma !== -1) {
    zonePart = s.slice(0, lastComma).trim();
    cityPart = s.slice(lastComma + 1).trim();
  }

  const numMatch = zonePart.match(/(\d+)/);
  const num = numMatch ? numMatch[1] : null;

  if (!cityPart) {
    for (const c of KNOWN_CITIES) {
      const re = new RegExp(`${c}\\b`, "i");
      if (re.test(zonePart)) {
        cityPart = c;
        break;
      }
    }
  }

  const city = cityPart ? normalizeCity(cityPart) : "";
  if (city) {
    return num ? `Taxes Zone-${num}, ${city}` : `Taxes Zone, ${city}`;
  }
  return titleCase(s);
}

export function normalizeSubmissionType(raw: string): SubmissionType | null {
  const t = String(raw)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (t.includes("universal") || t.includes("selfassess") || t === "usa") {
    return "Universal Self-Assessment";
  }
  if (t.includes("spot")) return "Spot Assessment";
  if (t.includes("normal") || t.includes("regular")) return "Normal";
  return null;
}

/** Normalize a circle token: "circle 5" / "Circle-5" → "Circle-5". */
export function normalizeCircle(raw: string): string {
  return String(raw)
    .replace(/\s+/g, "")
    .replace(/^circle-?/i, "Circle-");
}
