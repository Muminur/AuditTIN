import { getStats } from "@/lib/meta";

export const runtime = "edge";

/** Public aggregate statistics — counts only, never any TIN (CLAUDE.md §3). */
export function GET(): Response {
  const stats = getStats();
  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Aggregates are stable between dataset rebuilds; cache hard at the edge.
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
