import type { AuditDataset, PublicRecord, AuditRecord } from "./types";

// Bundled at build time by `scripts/ingest.ts` (runs via `prebuild`).
// This module imports the FULL TIN-keyed map — only import it from the edge
// lookup route and the Node-only admin console, never from light pages.
import datasetJson from "../../data/audit-2023-2024.json";

// Cast through `unknown`: the JSON is validated at ingest time, so we trust its
// shape here rather than re-deriving a 5k-key literal type.
const dataset = datasetJson as unknown as AuditDataset;

/** O(1) exact-match lookup. Returns null when the TIN is not on the list. */
export function lookup(tin: string): PublicRecord | null {
  return dataset[tin] ?? null;
}

export function getRecordCount(): number {
  return Object.keys(dataset).length;
}

/**
 * All records as an array — for the Node-only admin console.
 * Never import this into a public/edge/client bundle.
 */
export function getAllRecords(): AuditRecord[] {
  return Object.values(dataset);
}

// Re-export the light meta accessors for convenience in the lookup route.
export { getMeta, getStats } from "./meta";
