import type { AuditMeta, StatsPayload } from "./types";

// Light-weight accessors: only meta.json + stats.json (a few KB), never the
// full TIN-keyed dataset. Safe to import from any server component / page.
import metaJson from "../../data/meta.json";
import statsJson from "../../data/stats.json";

const meta = metaJson as unknown as AuditMeta;
const stats = statsJson as unknown as StatsPayload;

export function getMeta(): AuditMeta {
  return meta;
}

export function getStats(): StatsPayload {
  return stats;
}
